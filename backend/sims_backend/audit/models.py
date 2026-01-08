from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditLog(models.Model):
    """
    Immutable log of write operations performed via the API.
    Also referred to as AuditEvent in the spec.
    """

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_STATE_TRANSITION = "state_transition"
    ACTION_SPECIAL = "special_action"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_STATE_TRANSITION, "State Transition"),
        (ACTION_SPECIAL, "Special Action"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        help_text="User who performed the action",
    )
    method = models.CharField(
        max_length=16,
        help_text="HTTP method (POST, PUT, PATCH, DELETE)",
    )
    path = models.TextField(help_text="Request path")
    status_code = models.PositiveIntegerField(help_text="HTTP status code")
    entity = models.CharField(
        max_length=255,
        blank=True,
        help_text="Entity/model name (if applicable)",
    )
    entity_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Entity object ID (if applicable)",
    )
    action = models.CharField(
        max_length=32,
        choices=ACTION_CHOICES,
        default=ACTION_CREATE,
        help_text="Type of action performed",
    )
    summary = models.TextField(help_text="Action summary")
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Additional metadata (request data, old/new values, etc.)",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the request",
    )
    user_agent = models.CharField(
        max_length=512,
        blank=True,
        help_text="User agent string",
    )
    # Legacy field - kept for backward compatibility
    model = models.CharField(
        max_length=255,
        blank=True,
        help_text="Model name (deprecated, use entity instead)",
    )
    object_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Object ID (deprecated, use entity_id instead)",
    )
    request_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Request data (deprecated, use metadata instead)",
    )

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["actor", "timestamp"]),
            models.Index(fields=["entity", "entity_id"]),
            models.Index(fields=["action"]),
        ]
        # Prevent modifications
        permissions = [
            ("view_auditlog", "Can view audit log"),
        ]

    def __str__(self) -> str:
        return self.summary
