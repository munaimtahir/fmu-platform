from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditLog(models.Model):
    """Immutable log of write operations performed via the API."""

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
    model = models.CharField(
        max_length=255,
        blank=True,
        help_text="Model name (if applicable)",
    )
    object_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Object ID (if applicable)",
    )
    summary = models.TextField(help_text="Action summary")
    request_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Request data (JSON)",
    )

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["actor", "timestamp"]),
            models.Index(fields=["model", "object_id"]),
        ]

    def __str__(self) -> str:
        return self.summary
