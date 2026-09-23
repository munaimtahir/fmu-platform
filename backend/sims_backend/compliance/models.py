import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel
from sims_backend.students.models import Student
from sims_backend.private_storage import PrivateMediaStorage


class RequirementDefinition(TimeStampedModel):
    """Definition of a compliance requirement (e.g. 'Matric Certificate', 'Vaccination Record')"""

    TYPE_DOCUMENT = "document"
    TYPE_PROFILE_FIELD = "profile_field"
    TYPE_CHOICES = (
        (TYPE_DOCUMENT, "Document"),
        (TYPE_PROFILE_FIELD, "Profile Field"),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    requirement_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_DOCUMENT)
    is_mid_session = models.BooleanField(default=False, help_text="If true, assigned mid-session")
    is_active = models.BooleanField(default=True)
    is_onboarding_required = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class RequirementInstance(TimeStampedModel):
    """An instance of a requirement assigned to a specific student"""

    STATUS_PENDING = "pending"
    STATUS_SUBMITTED = "submitted"
    STATUS_VERIFIED = "verified"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_REJECTED, "Rejected"),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="compliance_requirements")
    definition = models.ForeignKey(RequirementDefinition, on_delete=models.CASCADE, related_name="instances")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_PENDING)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Admin feedback or notes")
    is_active = models.BooleanField(default=True)
    SOURCE_ONBOARDING = "onboarding_scope"
    SOURCE_MANUAL = "manual"
    SOURCE_CHOICES = ((SOURCE_ONBOARDING, "Onboarding scope"), (SOURCE_MANUAL, "Manual"))
    assignment_source = models.CharField(max_length=24, choices=SOURCE_CHOICES, default=SOURCE_MANUAL)

    class Meta:
        # Prevent duplicate assignment of the same requirement to the same student
        # If re-assignment is needed, we might need to handle it (e.g. by deleting the old one or archiving it)
        # But for now, uniqueness seems appropriate to avoid duplicates.
        unique_together = ("student", "definition")

    @property
    def is_locked(self):
        """
        72 hours before due, student is LOCKED until resolved.
        Unlock policy is per requirement (SUBMITTED or VERIFIED).
        """
        if self.status in [self.STATUS_SUBMITTED, self.STATUS_VERIFIED]:
            return False

        if not self.due_at:
            return False

        # Lock if now >= due_at - 72 hours
        lock_start_time = self.due_at - timedelta(hours=72)
        return timezone.now() >= lock_start_time

    def __str__(self):
        return f"{self.student.reg_no} - {self.definition.title}"


class RequirementScope(TimeStampedModel):
    """Global, Program, or Batch applicability for an onboarding requirement."""

    SCOPE_GLOBAL = "global"
    SCOPE_PROGRAM = "program"
    SCOPE_BATCH = "batch"
    SCOPE_CHOICES = (
        (SCOPE_GLOBAL, "Global"),
        (SCOPE_PROGRAM, "Program"),
        (SCOPE_BATCH, "Batch"),
    )

    definition = models.ForeignKey(RequirementDefinition, on_delete=models.CASCADE, related_name="scopes")
    scope_type = models.CharField(max_length=16, choices=SCOPE_CHOICES)
    program = models.ForeignKey(
        "academics.Program", on_delete=models.CASCADE, related_name="requirement_scopes", null=True, blank=True
    )
    batch = models.ForeignKey(
        "academics.Batch", on_delete=models.CASCADE, related_name="requirement_scopes", null=True, blank=True
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(scope_type="global", program__isnull=True, batch__isnull=True)
                    | models.Q(scope_type="program", program__isnull=False, batch__isnull=True)
                    | models.Q(scope_type="batch", program__isnull=True, batch__isnull=False)
                ),
                name="valid_requirement_scope_shape",
            ),
            models.UniqueConstraint(fields=["definition"], condition=models.Q(scope_type="global"), name="unique_global_requirement_scope"),
            models.UniqueConstraint(fields=["definition", "program"], condition=models.Q(scope_type="program"), name="unique_program_requirement_scope"),
            models.UniqueConstraint(fields=["definition", "batch"], condition=models.Q(scope_type="batch"), name="unique_batch_requirement_scope"),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.scope_type == self.SCOPE_GLOBAL and (self.program_id or self.batch_id):
            raise ValidationError("Global scopes cannot select a Program or Batch")
        if self.scope_type == self.SCOPE_PROGRAM and (not self.program_id or self.batch_id):
            raise ValidationError("Program scopes require only a Program")
        if self.scope_type == self.SCOPE_BATCH and (not self.batch_id or self.program_id):
            raise ValidationError("Batch scopes require only a Batch")


def compliance_document_path(instance, filename):
    """Store uploads under an opaque name; downloads are authorization-gated."""
    suffix = Path(filename).suffix.lower()
    return f"compliance_docs/{instance.instance.student_id}/{uuid.uuid4().hex}{suffix}"


class RequirementSubmission(TimeStampedModel):
    """A submission for a requirement (file upload or value entry)"""

    instance = models.ForeignKey(RequirementInstance, on_delete=models.CASCADE, related_name="submissions")
    file = models.FileField(upload_to=compliance_document_path, storage=PrivateMediaStorage(), null=True, blank=True)
    original_filename = models.CharField(max_length=255, blank=True)
    value = models.CharField(max_length=255, blank=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Submission for {self.instance}"


class ComplianceActionLog(TimeStampedModel):
    """Audit log for compliance actions"""

    instance = models.ForeignKey(RequirementInstance, on_delete=models.CASCADE, related_name="logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.instance}"
