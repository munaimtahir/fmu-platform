from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from .models import Notification, NotificationPreference, NotificationTemplate
from .serializers import (
    NotificationListSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    NotificationTemplateSerializer,
    SendNotificationSerializer,
)
from .services import send_notification


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["channel", "is_active"]
    search_fields = ["code", "name"]
    ordering_fields = ["name", "code", "channel"]
    ordering = ["channel", "name"]
    required_tasks = ["notifications.templates.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["notifications.templates.view"]
        elif self.action == "create":
            self.required_tasks = ["notifications.templates.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["notifications.templates.update"]
        elif self.action == "destroy":
            self.required_tasks = ["notifications.templates.delete"]
        return super().get_permissions()


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related("recipient", "template").all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["recipient", "channel", "status", "template"]
    search_fields = ["recipient_email", "recipient_phone", "subject"]
    ordering_fields = ["created_at", "sent_at", "delivered_at"]
    ordering = ["-created_at"]
    required_tasks = ["notifications.messages.view"]

    def get_serializer_class(self):
        if self.action == "list":
            return NotificationListSerializer
        return NotificationSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["notifications.messages.view"]
        elif self.action == "create":
            self.required_tasks = ["notifications.messages.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["notifications.messages.update"]
        elif self.action == "destroy":
            self.required_tasks = ["notifications.messages.delete"]
        elif self.action == "send":
            self.required_tasks = ["notifications.messages.send"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Users can view own notifications."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "notifications.messages.view"):
            return qs

        # Otherwise, return only own notifications
        return qs.filter(recipient=user)

    @action(detail=False, methods=["post"], url_path="send")
    def send(self, request):
        """Send a notification immediately."""
        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        notification = send_notification(
            template_code=data.get("template_code"),
            recipient_id=data.get("recipient_id"),
            recipient_email=data.get("recipient_email"),
            recipient_phone=data.get("recipient_phone"),
            channel=data["channel"],
            subject=data.get("subject"),
            body=data.get("body"),
            metadata=data.get("metadata"),
            created_by=request.user,
        )

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED
        )


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    queryset = NotificationPreference.objects.all()
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["user", "channel", "is_enabled"]
    ordering_fields = ["user", "channel"]
    ordering = ["user", "channel"]
    required_tasks = ["notifications.preferences.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["notifications.preferences.view"]
        elif self.action == "create":
            self.required_tasks = ["notifications.preferences.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["notifications.preferences.update"]
        elif self.action == "destroy":
            self.required_tasks = ["notifications.preferences.delete"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Users can view own preferences."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "notifications.preferences.view"):
            return qs

        # Otherwise, return only own preferences
        return qs.filter(user=user)

    def perform_create(self, serializer):
        """Set user to current user if not provided."""
        if "user" not in serializer.validated_data:
            serializer.save(user=self.request.user)
        else:
            serializer.save()
