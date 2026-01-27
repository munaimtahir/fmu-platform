from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class Notification(TimeStampedModel):
    """Notification broadcast with optional email delivery."""

    STATUS_DRAFT = "DRAFT"
    STATUS_QUEUED = "QUEUED"
    STATUS_SENT = "SENT"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_QUEUED, "Queued"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    PRIORITY_LOW = "LOW"
    PRIORITY_NORMAL = "NORMAL"
    PRIORITY_HIGH = "HIGH"
    PRIORITY_URGENT = "URGENT"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_NORMAL, "Normal"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_URGENT, "Urgent"),
    ]

    title = models.CharField(max_length=255, help_text="Notification title")
    body = models.TextField(help_text="Notification body")
    category = models.CharField(max_length=64, help_text="Notification category")
    priority = models.CharField(
        max_length=16,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_NORMAL,
        help_text="Notification priority",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_notifications",
    )
    send_email = models.BooleanField(default=False, help_text="Also send email notifications")
    publish_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"

    def mark_queued(self):
        if self.status != self.STATUS_QUEUED:
            self.status = self.STATUS_QUEUED
            if not self.publish_at:
                self.publish_at = timezone.now()
            self.save(update_fields=["status", "publish_at", "updated_at"])


class NotificationAudience(TimeStampedModel):
    """Defines audience targeting for a notification."""

    AUDIENCE_STUDENT = "STUDENT"
    AUDIENCE_ALL_STUDENTS = "ALL_STUDENTS"
    AUDIENCE_SECTION = "SECTION"
    AUDIENCE_BATCH = "BATCH"
    AUDIENCE_PROGRAM = "PROGRAM"
    AUDIENCE_GROUP = "GROUP"

    AUDIENCE_CHOICES = [
        (AUDIENCE_STUDENT, "Student"),
        (AUDIENCE_ALL_STUDENTS, "All Students"),
        (AUDIENCE_SECTION, "Section"),
        (AUDIENCE_BATCH, "Batch"),
        (AUDIENCE_PROGRAM, "Program"),
        (AUDIENCE_GROUP, "Group"),
    ]

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="audiences"
    )
    audience_type = models.CharField(max_length=32, choices=AUDIENCE_CHOICES)
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_audiences",
    )
    section = models.ForeignKey(
        "academics.Section",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_audiences",
    )
    batch = models.ForeignKey(
        "academics.Batch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_audiences",
    )
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_audiences",
    )
    group = models.ForeignKey(
        "academics.Group",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_audiences",
    )
    filters_json = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["audience_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.notification_id} -> {self.audience_type}"


class NotificationInbox(TimeStampedModel):
    """Inbox entry for a notification delivered to a user."""

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="inbox_entries"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_inbox"
    )
    delivered_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = [("notification", "user")]
        ordering = ["-delivered_at"]
        indexes = [
            models.Index(fields=["user", "read_at"]),
            models.Index(fields=["user", "is_deleted"]),
        ]

    def __str__(self) -> str:
        return f"Inbox {self.user_id} -> {self.notification_id}"


class NotificationDeliveryLog(TimeStampedModel):
    """Tracks delivery attempts for notifications."""

    CHANNEL_IN_APP = "IN_APP"
    CHANNEL_EMAIL = "EMAIL"

    CHANNEL_CHOICES = [
        (CHANNEL_IN_APP, "In-app"),
        (CHANNEL_EMAIL, "Email"),
    ]

    STATUS_PENDING = "PENDING"
    STATUS_SENT = "SENT"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name="delivery_logs"
    )
    channel = models.CharField(max_length=16, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    target_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    failure_count = models.PositiveIntegerField(default=0)
    error_sample = models.TextField(null=True, blank=True)
    job_id = models.CharField(max_length=64, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["channel", "status"]),
            models.Index(fields=["notification"]),
        ]

    def __str__(self) -> str:
        return f"{self.notification_id} {self.channel} {self.status}"
