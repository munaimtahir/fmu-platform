import hashlib
import uuid

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class FacultyImportJob(TimeStampedModel):
    """Tracks CSV import operations for Faculty"""

    STATUS_PENDING = "PENDING"
    STATUS_PREVIEWED = "PREVIEWED"
    STATUS_COMMITTED = "COMMITTED"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PREVIEWED, "Previewed"),
        (STATUS_COMMITTED, "Committed"),
        (STATUS_FAILED, "Failed"),
    ]

    MODE_CREATE_ONLY = "CREATE_ONLY"
    MODE_UPSERT = "UPSERT"

    MODE_CHOICES = [
        (MODE_CREATE_ONLY, "Create Only"),
        (MODE_UPSERT, "Upsert"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="faculty_import_jobs",
        help_text="User who initiated the import",
    )
    finished_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when import was completed or failed",
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Current status of the import job",
    )
    mode = models.CharField(
        max_length=32,
        choices=MODE_CHOICES,
        default=MODE_CREATE_ONLY,
        help_text="Import mode: create-only or upsert",
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename of the uploaded CSV",
    )
    file = models.FileField(
        upload_to="imports/faculty/%Y/%m/%d/",
        help_text="Uploaded CSV file",
    )
    file_hash = models.CharField(
        max_length=64,
        help_text="SHA256 hash of the file for duplicate detection",
    )
    total_rows = models.PositiveIntegerField(
        default=0,
        help_text="Total number of rows in the CSV (excluding header)",
    )
    valid_rows = models.PositiveIntegerField(
        default=0,
        help_text="Number of valid rows that passed validation",
    )
    invalid_rows = models.PositiveIntegerField(
        default=0,
        help_text="Number of invalid rows with errors",
    )
    created_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of faculty created during commit",
    )
    updated_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of faculty updated during commit (upsert mode)",
    )
    failed_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of rows that failed during commit",
    )
    error_report_file = models.FileField(
        upload_to="imports/faculty/errors/%Y/%m/%d/",
        null=True,
        blank=True,
        help_text="CSV file containing invalid rows with error messages",
    )
    summary = models.JSONField(
        null=True,
        blank=True,
        help_text="Structured summary of import results",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["file_hash", "mode"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self):
        return f"FacultyImportJob {self.id} - {self.original_filename} ({self.status})"

    @staticmethod
    def compute_file_hash(file) -> str:
        """Compute SHA256 hash of a file"""
        file.seek(0)
        hash_obj = hashlib.sha256()
        for chunk in file.chunks():
            hash_obj.update(chunk)
        file.seek(0)
        return hash_obj.hexdigest()
