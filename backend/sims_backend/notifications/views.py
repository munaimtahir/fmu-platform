import django_filters
import django_rq
from django.db import models, transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task
from sims_backend.notifications.jobs import expand_audience_and_create_inbox
from sims_backend.notifications.models import Notification, NotificationInbox
from sims_backend.notifications.serializers import (
    NotificationCreateSerializer,
    NotificationInboxSerializer,
    NotificationSerializer,
)


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
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["notifications.admin.view"]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = NotificationFilter
    ordering_fields = ["created_at", "publish_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "create":
            self.required_tasks = ["notifications.admin.create"]
        elif self.action == "send_notification":
            self.required_tasks = ["notifications.admin.send"]
        else:
            self.required_tasks = ["notifications.admin.view"]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return NotificationCreateSerializer
        return NotificationSerializer

    def perform_create(self, serializer):
        send_now = self.request.data.get("send_now") in [True, "true", "True", "1", 1]
        if send_now and not has_permission_task(self.request.user, "notifications.admin.send"):
            raise PermissionDenied("You do not have permission to send notifications.")
        notification = serializer.save()
        if send_now:
            notification.mark_queued()
            queue = django_rq.get_queue("default")
            queue.enqueue(expand_audience_and_create_inbox, notification.id)

    @action(detail=True, methods=["post"], url_path="send")
    def send_notification(self, request, pk=None):
        notification = self.get_object()
        if notification.status == Notification.STATUS_SENT:
            return Response(
                {"error": {"code": "ALREADY_SENT", "message": "Notification already sent."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            notification.mark_queued()
            queue = django_rq.get_queue("default")
            job = queue.enqueue(expand_audience_and_create_inbox, notification.id)

        return Response(
            {"message": "Notification queued", "job_id": job.id},
            status=status.HTTP_202_ACCEPTED,
        )


class NotificationInboxViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationInboxSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    required_tasks = ["notifications.inbox.view"]

    def get_permissions(self):
        if self.action in ["mark_read", "mark_all_read"]:
            self.required_tasks = ["notifications.inbox.update"]
        else:
            self.required_tasks = ["notifications.inbox.view"]
        return super().get_permissions()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return NotificationInbox.objects.none()
        now = timezone.now()
        queryset = NotificationInbox.objects.select_related("notification").filter(
            user=self.request.user,
            is_deleted=False,
        )
        queryset = queryset.filter(
            models.Q(notification__publish_at__isnull=True) | models.Q(notification__publish_at__lte=now)
        ).filter(models.Q(notification__expires_at__isnull=True) | models.Q(notification__expires_at__gt=now))
        unread_only = self.request.query_params.get("unread")
        if unread_only in ["true", "True", "1", 1, True]:
            queryset = queryset.filter(read_at__isnull=True)
        return queryset

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
