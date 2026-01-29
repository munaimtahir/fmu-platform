"""Background jobs for notifications."""

import logging
import os
from typing import Iterable

import django_rq
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from sims_backend.notifications.models import (
    Notification,
    NotificationAudience,
    NotificationDeliveryLog,
    NotificationInbox,
)
from sims_backend.students.models import Student

logger = logging.getLogger(__name__)


ALLOWED_FILTER_FIELDS = {
    "status",
    "enrollment_year",
    "expected_graduation_year",
}


def _apply_student_filters(queryset, filters_json: dict | None):
    if not isinstance(filters_json, dict):
        return queryset
    safe_filters = {key: value for key, value in filters_json.items() if key in ALLOWED_FILTER_FIELDS}
    if not safe_filters:
        return queryset
    return queryset.filter(**safe_filters)


def _students_for_audience(audience: NotificationAudience) -> Iterable[Student]:
    if audience.audience_type == NotificationAudience.AUDIENCE_ALL_STUDENTS:
        return _apply_student_filters(Student.objects.all(), audience.filters_json)
    if audience.audience_type == NotificationAudience.AUDIENCE_STUDENT and audience.student_id:
        return Student.objects.filter(id=audience.student_id)
    if audience.audience_type == NotificationAudience.AUDIENCE_SECTION and audience.section:
        if audience.section.group_id:
            return _apply_student_filters(
                Student.objects.filter(group_id=audience.section.group_id),
                audience.filters_json,
            )
        return Student.objects.none()
    if audience.audience_type == NotificationAudience.AUDIENCE_BATCH and audience.batch:
        return _apply_student_filters(Student.objects.filter(batch=audience.batch), audience.filters_json)
    if audience.audience_type == NotificationAudience.AUDIENCE_PROGRAM and audience.program:
        return _apply_student_filters(Student.objects.filter(program=audience.program), audience.filters_json)
    if audience.audience_type == NotificationAudience.AUDIENCE_GROUP and audience.group:
        return _apply_student_filters(Student.objects.filter(group=audience.group), audience.filters_json)
    return Student.objects.none()


def _chunked_ids(user_ids: list[int], chunk_size: int) -> Iterable[list[int]]:
    for idx in range(0, len(user_ids), chunk_size):
        yield user_ids[idx : idx + chunk_size]


def _update_notification_status_if_complete(notification: Notification) -> None:
    required_channels = {NotificationDeliveryLog.CHANNEL_IN_APP}
    if notification.send_email:
        required_channels.add(NotificationDeliveryLog.CHANNEL_EMAIL)

    sent_channels = set(
        NotificationDeliveryLog.objects.filter(
            notification=notification,
            channel__in=required_channels,
            status=NotificationDeliveryLog.STATUS_SENT,
        ).values_list("channel", flat=True)
    )
    if required_channels.issubset(sent_channels) and notification.status != Notification.STATUS_SENT:
        notification.status = Notification.STATUS_SENT
        notification.save(update_fields=["status", "updated_at"])


def expand_audience_and_create_inbox(notification_id: int) -> dict[str, int]:
    """Resolve notification audiences and create inbox entries."""
    notification = Notification.objects.get(id=notification_id)
    if notification.status != Notification.STATUS_QUEUED:
        logger.info(
            "Notification expansion skipped due to status",
            extra={"notification_id": notification_id, "status": notification.status},
        )
        return {"target_count": 0, "delivered_count": 0, "existing_count": 0}
    audiences = notification.audiences.select_related(
        "student", "section", "batch", "program", "group"
    )

    user_ids: set[int] = set()
    for audience in audiences:
        students = _students_for_audience(audience)
        user_ids.update(students.exclude(user_id__isnull=True).values_list("user_id", flat=True))

    target_count = len(user_ids)
    delivered_at = timezone.now()
    user_id_list = list(user_ids)
    chunk_size = int(os.getenv("NOTIF_INBOX_BULK_CHUNK", "2000"))

    with transaction.atomic():
        existing_count = NotificationInbox.objects.filter(
            notification=notification, user_id__in=user_id_list
        ).count()
        for chunk in _chunked_ids(user_id_list, chunk_size):
            NotificationInbox.objects.bulk_create(
                [
                    NotificationInbox(
                        notification=notification,
                        user_id=user_id,
                        delivered_at=delivered_at,
                    )
                    for user_id in chunk
                ],
                ignore_conflicts=True,
            )

        total_count = NotificationInbox.objects.filter(
            notification=notification, user_id__in=user_id_list
        ).count()

        NotificationDeliveryLog.objects.update_or_create(
            notification=notification,
            channel=NotificationDeliveryLog.CHANNEL_IN_APP,
            defaults={
                "status": NotificationDeliveryLog.STATUS_SENT,
                "target_count": target_count,
                "success_count": total_count,
                "failure_count": max(0, target_count - total_count),
                "error_sample": None,
            },
        )

        if not notification.publish_at:
            notification.publish_at = delivered_at
            notification.save(update_fields=["publish_at", "updated_at"])

        _update_notification_status_if_complete(notification)

    if notification.send_email:
        if not user_id_list:
            NotificationDeliveryLog.objects.update_or_create(
                notification=notification,
                channel=NotificationDeliveryLog.CHANNEL_EMAIL,
                defaults={
                    "status": NotificationDeliveryLog.STATUS_SENT,
                    "target_count": 0,
                    "success_count": 0,
                    "failure_count": 0,
                    "error_sample": None,
                    "job_id": None,
                },
            )
            _update_notification_status_if_complete(notification)
        else:
            existing_log = NotificationDeliveryLog.objects.filter(
                notification=notification,
                channel=NotificationDeliveryLog.CHANNEL_EMAIL,
            ).first()
            if existing_log and existing_log.status == NotificationDeliveryLog.STATUS_SENT:
                _update_notification_status_if_complete(notification)
            else:
                queue = django_rq.get_queue("default")
                job = queue.enqueue(send_notification_email_batch, notification.id, user_id_list)
                NotificationDeliveryLog.objects.update_or_create(
                    notification=notification,
                    channel=NotificationDeliveryLog.CHANNEL_EMAIL,
                    defaults={
                        "status": NotificationDeliveryLog.STATUS_PENDING,
                        "target_count": target_count,
                        "job_id": job.id,
                    },
                )

    logger.info(
        "Notification expansion completed",
        extra={"notification_id": notification_id, "target_count": target_count},
    )
    return {
        "target_count": target_count,
        "delivered_count": total_count,
        "existing_count": existing_count,
    }


def send_notification_email_batch(notification_id: int, user_ids: list[int]) -> dict[str, int]:
    """Send a batch of notification emails."""
    notification = Notification.objects.get(id=notification_id)
    User = get_user_model()
    target_count = len(user_ids)

    log_entry, _ = NotificationDeliveryLog.objects.get_or_create(
        notification=notification,
        channel=NotificationDeliveryLog.CHANNEL_EMAIL,
        defaults={"status": NotificationDeliveryLog.STATUS_PENDING, "target_count": target_count},
    )
    if log_entry.status == NotificationDeliveryLog.STATUS_SENT:
        return {"target_count": log_entry.target_count, "success_count": 0, "failure_count": 0}
    if log_entry.target_count != target_count:
        log_entry.target_count = target_count
        log_entry.save(update_fields=["target_count", "updated_at"])

    success_count = 0
    failure_count = 0
    error_sample = None

    users = User.objects.filter(id__in=user_ids).exclude(email="")
    batch_size = int(os.getenv("NOTIF_EMAIL_BATCH_SIZE", "200"))

    for batch_ids in _chunked_ids(list(users.values_list("id", flat=True)), batch_size):
        for user in users.filter(id__in=batch_ids):
            try:
                send_mail(
                    subject=notification.title,
                    message=notification.body,
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                success_count += 1
            except Exception as exc:  # noqa: BLE001
                failure_count += 1
                if not error_sample:
                    message = f"{type(exc).__name__}: {exc}"
                    error_sample = message[:500]

    log_entry.success_count = success_count
    log_entry.failure_count = failure_count
    log_entry.error_sample = error_sample
    log_entry.status = (
        NotificationDeliveryLog.STATUS_SENT if failure_count == 0 else NotificationDeliveryLog.STATUS_FAILED
    )
    log_entry.save(
        update_fields=[
            "success_count",
            "failure_count",
            "error_sample",
            "status",
            "target_count",
            "updated_at",
        ]
    )
    _update_notification_status_if_complete(notification)

    logger.info(
        "Notification email delivery completed",
        extra={
            "notification_id": notification_id,
            "success_count": success_count,
            "failure_count": failure_count,
        },
    )

    return {
        "target_count": len(user_ids),
        "success_count": success_count,
        "failure_count": failure_count,
    }
