"""
Notifications module models - Unified outbound communication layer.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class NotificationTemplate(TimeStampedModel):
    """Template for notifications."""

    CHANNEL_EMAIL = "email"
    CHANNEL_SMS = "sms"
    CHANNEL_WHATSAPP = "whatsapp"
    CHANNEL_PUSH = "push"

    CHANNEL_CHOICES = [
        (CHANNEL_EMAIL, "Email"),
        (CHANNEL_SMS, "SMS"),
        (CHANNEL_WHATSAPP, "WhatsApp"),
        (CHANNEL_PUSH, "Push Notification"),
    ]

    code = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique template code",
    )
    name = models.CharField(
        max_length=255,
        help_text="Template name",
    )
    channel = models.CharField(
        max_length=20,
        choices=CHANNEL_CHOICES,
        help_text="Notification channel",
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        help_text="Subject line (for email)",
    )
    body = models.TextField(
        help_text="Template body with placeholders (e.g., {{student_name}})",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this template is active",
    )

    class Meta:
        ordering = ["channel", "name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["channel", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_channel_display()})"


class Notification(TimeStampedModel):
    """Sent notification record."""

    STATUS_PENDING = "pending"
    STATUS_SENT = "sent"
    STATUS_DELIVERED = "delivered"
    STATUS_FAILED = "failed"
    STATUS_BOUNCED = "bounced"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SENT, "Sent"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_FAILED, "Failed"),
        (STATUS_BOUNCED, "Bounced"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Recipient user (if registered)",
    )
    recipient_email = models.EmailField(
        blank=True,
        help_text="Recipient email address",
    )
    recipient_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Recipient phone number",
    )
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Template used",
    )
    channel = models.CharField(
        max_length=20,
        choices=NotificationTemplate.CHANNEL_CHOICES,
        help_text="Notification channel",
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        help_text="Rendered subject",
    )
    body = models.TextField(
        help_text="Rendered body",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Delivery status",
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the notification was sent",
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the notification was delivered",
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error message if failed",
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Context data used for rendering",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "status"]),
            models.Index(fields=["channel", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        recipient = self.recipient.username if self.recipient else self.recipient_email or self.recipient_phone
        return f"Notification to {recipient} ({self.get_status_display()})"


class NotificationPreference(TimeStampedModel):
    """User notification preferences."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        help_text="User",
    )
    channel = models.CharField(
        max_length=20,
        choices=NotificationTemplate.CHANNEL_CHOICES,
        help_text="Notification channel",
    )
    is_enabled = models.BooleanField(
        default=True,
        help_text="Whether notifications are enabled for this channel",
    )
    notification_types = models.JSONField(
        default=list,
        help_text="List of template codes to receive (empty = all)",
    )

    class Meta:
        ordering = ["user", "channel"]
        unique_together = [["user", "channel"]]

    def __str__(self) -> str:
        status = "enabled" if self.is_enabled else "disabled"
        return f"{self.user.username} - {self.get_channel_display()} ({status})"
