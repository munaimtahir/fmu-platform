"""Background jobs for notifications."""

import logging
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
    if audience.audience_type == NotificationAudience.AUDIENCE_STUDENT and audience.student:
        return [audience.student]
    if audience.audience_type == NotificationAudience.AUDIENCE_SECTION and audience.section:
        if audience.section.group_id:
            return _apply_student_filters(
                Student.objects.filter(group_id=audience.section.group_id),
                audience.filters_json,
            )
        return []
    if audience.audience_type == NotificationAudience.AUDIENCE_BATCH and audience.batch:
        return _apply_student_filters(Student.objects.filter(batch=audience.batch), audience.filters_json)
    if audience.audience_type == NotificationAudience.AUDIENCE_PROGRAM and audience.program:
        return _apply_student_filters(Student.objects.filter(program=audience.program), audience.filters_json)
    if audience.audience_type == NotificationAudience.AUDIENCE_GROUP and audience.group:
        return _apply_student_filters(Student.objects.filter(group=audience.group), audience.filters_json)
    return []


def expand_audience_and_create_inbox(notification_id: int) -> dict[str, int]:
    """Resolve notification audiences and create inbox entries."""
    notification = Notification.objects.get(id=notification_id)
    audiences = notification.audiences.select_related(
        "student", "section", "batch", "program", "group"
    )

    user_ids: set[int] = set()
    for audience in audiences:
        students = _students_for_audience(audience)
        for student in students:
            if student.user_id:
                user_ids.add(student.user_id)

    target_count = len(user_ids)
    delivered_at = timezone.now()

    with transaction.atomic():
        existing_count = NotificationInbox.objects.filter(
            notification=notification, user_id__in=user_ids
        ).count()
        NotificationInbox.objects.bulk_create(
            [
                NotificationInbox(
                    notification=notification,
                    user_id=user_id,
                    delivered_at=delivered_at,
                )
                for user_id in user_ids
            ],
            ignore_conflicts=True,
        )
        total_count = NotificationInbox.objects.filter(
            notification=notification, user_id__in=user_ids
        ).count()

        delivery_log = NotificationDeliveryLog.objects.create(
            notification=notification,
            channel=NotificationDeliveryLog.CHANNEL_IN_APP,
            status=NotificationDeliveryLog.STATUS_SENT,
            target_count=target_count,
            success_count=total_count,
            failure_count=max(0, target_count - total_count),
        )
        notification.status = Notification.STATUS_SENT
        if not notification.publish_at:
            notification.publish_at = delivered_at
        notification.save(update_fields=["status", "publish_at", "updated_at"])

    if notification.send_email and user_ids:
        queue = django_rq.get_queue("default")
        batch_size = 100
        user_id_list = list(user_ids)
        for idx in range(0, len(user_id_list), batch_size):
            batch_ids = user_id_list[idx : idx + batch_size]
            log = NotificationDeliveryLog.objects.create(
                notification=notification,
                channel=NotificationDeliveryLog.CHANNEL_EMAIL,
                status=NotificationDeliveryLog.STATUS_PENDING,
                target_count=len(batch_ids),
            )
            job = queue.enqueue(send_notification_email_batch, notification.id, batch_ids, log.id)
            log.job_id = job.id
            log.save(update_fields=["job_id", "updated_at"])

    return {
        "target_count": target_count,
        "delivered_count": total_count,
        "existing_count": existing_count,
    }


def send_notification_email_batch(
    notification_id: int, user_ids: list[int], log_id: int | None = None
) -> dict[str, int]:
    """Send a batch of notification emails."""
    notification = Notification.objects.get(id=notification_id)
    User = get_user_model()

    if log_id:
        log_entry = NotificationDeliveryLog.objects.get(id=log_id)
        if log_entry.target_count != len(user_ids):
            log_entry.target_count = len(user_ids)
    else:
        log_entry = NotificationDeliveryLog.objects.create(
            notification=notification,
            channel=NotificationDeliveryLog.CHANNEL_EMAIL,
            status=NotificationDeliveryLog.STATUS_PENDING,
            target_count=len(user_ids),
        )

    success_count = 0
    failure_count = 0
    error_sample = None

    users = User.objects.filter(id__in=user_ids).exclude(email="")

    for user in users:
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
                error_sample = type(exc).__name__

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

    return {
        "target_count": len(user_ids),
        "success_count": success_count,
        "failure_count": failure_count,
    }
