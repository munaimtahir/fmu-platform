import django_rq
import django_filters
import logging

from django.db import models, transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsNotificationAdmin, IsStudentOrNotificationAdmin
from sims_backend.notifications.jobs import expand_audience_and_create_inbox
from sims_backend.notifications.models import Notification, NotificationInbox
from sims_backend.notifications.serializers import (
    NotificationCreateSerializer,
    NotificationInboxSerializer,
    NotificationSerializer,
)

logger = logging.getLogger(__name__)


class NotificationFilter(django_filters.FilterSet):
    start_date = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    end_date = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Notification
        fields = ["status", "category", "created_by"]


class NotificationAdminViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Notification.objects.all().select_related("created_by")
    permission_classes = [IsAuthenticated, IsNotificationAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = NotificationFilter
    ordering_fields = ["created_at", "publish_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return NotificationCreateSerializer
        return NotificationSerializer

    def perform_create(self, serializer):
        notification = serializer.save()
        send_now = self.request.data.get("send_now")
        if send_now in [True, "true", "True", "1", 1]:
            notification.mark_queued()
            queue = django_rq.get_queue("default")
            queue.enqueue(expand_audience_and_create_inbox, notification.id)

    @action(detail=True, methods=["post"], url_path="send")
    def send_notification(self, request, pk=None):
        with transaction.atomic():
            notification = (
                Notification.objects.select_for_update()
                .select_related("created_by")
                .get(pk=pk)
            )
            logger.info(
                "Notification send requested",
                extra={
                    "notification_id": notification.id,
                    "created_by": request.user.id,
                    "send_email": notification.send_email,
                },
            )
            if notification.status in (
                Notification.STATUS_QUEUED,
                Notification.STATUS_SENT,
                Notification.STATUS_CANCELLED,
            ):
                return Response(
                    {
                        "error": {
                            "code": "INVALID_STATE",
                            "message": "Notification cannot be sent from its current state.",
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            notification.status = Notification.STATUS_QUEUED
            if not notification.publish_at:
                notification.publish_at = timezone.now()
            notification.save(update_fields=["status", "publish_at", "updated_at"])

        queue = django_rq.get_queue("default")
        job = queue.enqueue(expand_audience_and_create_inbox, notification.id)

        return Response(
            {"message": "Notification queued", "job_id": job.id},
            status=status.HTTP_202_ACCEPTED,
        )


class NotificationInboxViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationInboxSerializer
    permission_classes = [IsAuthenticated, IsStudentOrNotificationAdmin]

    def get_queryset(self):
        now = timezone.now()
        queryset = NotificationInbox.objects.select_related("notification").filter(
            user=self.request.user,
            is_deleted=False,
        )
        queryset = queryset.filter(
            models.Q(notification__publish_at__isnull=True)
            | models.Q(notification__publish_at__lte=now)
        ).filter(
            models.Q(notification__expires_at__isnull=True)
            | models.Q(notification__expires_at__gt=now)
        )
        unread_only = self.request.query_params.get("unread")
        if unread_only in ["true", "True", "1", 1, True]:
            queryset = queryset.filter(read_at__isnull=True)
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(notification__category=category)
        return queryset.order_by("-delivered_at", "-id")

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().filter(read_at__isnull=True).count()
        return Response({"count": count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        inbox_entry = self.get_object()
        if inbox_entry.read_at is None:
            inbox_entry.read_at = timezone.now()
            inbox_entry.save(update_fields=["read_at", "updated_at"])
        return Response(self.get_serializer(inbox_entry).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({"marked_read": updated}, status=status.HTTP_200_OK)
