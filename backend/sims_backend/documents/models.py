"""
Documents module models - Official academic documents generation and verification.
"""
from __future__ import annotations

import secrets
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class DocumentType(TimeStampedModel):
    """Types of documents that can be generated."""

    code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique code (e.g., 'transcript', 'certificate')",
    )
    name = models.CharField(
        max_length=100,
        help_text="Human-readable name",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this document type",
    )
    template = models.TextField(
        blank=True,
        help_text="Template content or path",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this document type is currently active",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Document(TimeStampedModel):
    """Generated document for a student."""

    STATUS_PENDING = "pending"
    STATUS_GENERATING = "generating"
    STATUS_READY = "ready"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_GENERATING, "Generating"),
        (STATUS_READY, "Ready"),
        (STATUS_FAILED, "Failed"),
    ]

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="documents",
        help_text="Student this document is for",
    )
    type = models.ForeignKey(
        DocumentType,
        on_delete=models.PROTECT,
        related_name="documents",
        help_text="Type of document",
    )
    document_number = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique document number",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Document status",
    )
    file = models.FileField(
        upload_to="documents/generated/",
        null=True,
        blank=True,
        help_text="Generated document file",
    )
    verification_token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Token for public verification",
    )
    qr_code = models.ImageField(
        upload_to="documents/qr/",
        null=True,
        blank=True,
        help_text="QR code for verification",
    )
    generated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the document was generated",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="requested_documents",
        help_text="User who requested the document",
    )
    requested_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the document was requested",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the document expires (if applicable)",
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Additional metadata for document generation",
    )

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["student", "type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["verification_token"]),
        ]

    def __str__(self) -> str:
        return f"{self.type.name} - {self.student.reg_no} ({self.document_number})"

    def save(self, *args, **kwargs):
        if not self.document_number:
            self.document_number = self._generate_document_number()
        if not self.verification_token:
            # Generate signed token for verification
            from django.core.signing import TimestampSigner
            signer = TimestampSigner()
            self.verification_token = signer.sign(f"doc_{self.id if self.id else 'new'}")
        super().save(*args, **kwargs)

    def _generate_document_number(self) -> str:
        """Generate a unique document number."""
        prefix = self.type.code.upper()[:3] if self.type else "DOC"
        year = timezone.now().year
        unique_id = str(uuid.uuid4().hex)[:8].upper()
        return f"{prefix}-{year}-{unique_id}"


class DocumentGenerationJob(TimeStampedModel):
    """Job for async document generation."""

    STATUS_QUEUED = "queued"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_QUEUED, "Queued"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="generation_jobs",
        help_text="Document being generated",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_QUEUED,
        help_text="Job status",
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the job started",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the job completed",
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error message if failed",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Job for {self.document.document_number} ({self.get_status_display()})"
