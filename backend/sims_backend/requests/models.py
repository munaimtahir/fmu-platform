"""
Requests module models - Universal change-request and approval workflow.
Any post-lock or sensitive change must flow through Requests.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class RequestType(TimeStampedModel):
    """Types of requests that can be submitted."""

    code = models.CharField(
        max_length=50,
        unique=True,
        help_text=(
            "Unique code (e.g., 'profile_correction', "
            "'enrollment_correction')"
        ),
    )
    name = models.CharField(
        max_length=100,
        help_text="Human-readable name",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this request type",
    )
    target_module = models.CharField(
        max_length=50,
        help_text="Target module (e.g., 'students', 'enrollment', 'results')",
    )
    requires_attachment = models.BooleanField(
        default=False,
        help_text="Whether attachments are required for this request type",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this request type is currently active",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Request(TimeStampedModel):
    """A request submitted by a user for review and approval."""

    STATUS_PENDING = "pending"
    STATUS_UNDER_REVIEW = "under_review"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_COMPLETED = "completed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_UNDER_REVIEW, "Under Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_COMPLETED, "Completed"),
    ]

    PRIORITY_LOW = "low"
    PRIORITY_MEDIUM = "medium"
    PRIORITY_HIGH = "high"
    PRIORITY_URGENT = "urgent"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_URGENT, "Urgent"),
    ]

    type = models.ForeignKey(
        RequestType,
        on_delete=models.PROTECT,
        related_name="requests",
        help_text="Type of request",
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_requests",
        help_text="User who submitted the request",
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="requests",
        help_text="Student this request is for (if applicable)",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Current status of the request",
    )
    title = models.CharField(
        max_length=255,
        help_text="Request title/summary",
    )
    description = models.TextField(
        help_text="Detailed description of the request",
    )
    data = models.JSONField(
        null=True,
        blank=True,
        help_text="Request-specific data (e.g., fields to change)",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_requests",
        help_text="User assigned to process this request",
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
        help_text="Request priority",
    )
    submitted_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the request was submitted",
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the request was resolved",
    )
    resolution_notes = models.TextField(
        blank=True,
        help_text="Notes about the resolution",
    )

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["requester", "status"]),
            models.Index(fields=["assigned_to", "status"]),
            models.Index(fields=["priority", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.type.name}: {self.title}"

    @property
    def is_editable(self) -> bool:
        """Check if the request can be edited."""
        return self.status in [self.STATUS_PENDING, self.STATUS_UNDER_REVIEW]

    @property
    def is_resolvable(self) -> bool:
        """Check if the request can be resolved (approved/rejected)."""
        return self.status in [self.STATUS_PENDING, self.STATUS_UNDER_REVIEW]


class RequestAttachment(TimeStampedModel):
    """Attachment for a request."""

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="attachments",
        help_text="Request this attachment belongs to",
    )
    file = models.FileField(
        upload_to="requests/attachments/",
        help_text="Uploaded file",
    )
    name = models.CharField(
        max_length=255,
        help_text="File name",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_request_attachments",
        help_text="User who uploaded the attachment",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.request.title})"


class RequestRemark(TimeStampedModel):
    """Remark/comment on a request."""

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="remarks",
        help_text="Request this remark belongs to",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="request_remarks",
        help_text="User who made the remark",
    )
    content = models.TextField(
        help_text="Remark content",
    )
    is_internal = models.BooleanField(
        default=False,
        help_text=(
            "Whether this is an internal remark "
            "(not visible to requester)"
        ),
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Remark by {self.author.username} on {self.request.title}"


class RequestHistory(TimeStampedModel):
    """History/audit trail for a request."""

    ACTION_CREATED = "created"
    ACTION_ASSIGNED = "assigned"
    ACTION_STATUS_CHANGED = "status_changed"
    ACTION_REMARKED = "remarked"
    ACTION_ATTACHMENT_ADDED = "attachment_added"

    ACTION_CHOICES = [
        (ACTION_CREATED, "Created"),
        (ACTION_ASSIGNED, "Assigned"),
        (ACTION_STATUS_CHANGED, "Status Changed"),
        (ACTION_REMARKED, "Remarked"),
        (ACTION_ATTACHMENT_ADDED, "Attachment Added"),
    ]

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="history",
        help_text="Request this history entry belongs to",
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="request_history_entries",
        help_text="User who performed the action",
    )
    old_value = models.JSONField(
        null=True,
        blank=True,
        help_text="Previous value (for changes)",
    )
    new_value = models.JSONField(
        null=True,
        blank=True,
        help_text="New value (for changes)",
    )
    summary = models.TextField(
        blank=True,
        help_text="Human-readable summary of the action",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Request histories"

    def __str__(self) -> str:
        return f"{self.get_action_display()} on {self.request.title}"
