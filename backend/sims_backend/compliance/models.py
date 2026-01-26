from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from core.models import TimeStampedModel
from sims_backend.students.models import Student

class RequirementDefinition(TimeStampedModel):
    """Definition of a compliance requirement (e.g. 'Matric Certificate', 'Vaccination Record')"""
    TYPE_DOCUMENT = 'document'
    TYPE_PROFILE_FIELD = 'profile_field'
    TYPE_CHOICES = (
        (TYPE_DOCUMENT, 'Document'),
        (TYPE_PROFILE_FIELD, 'Profile Field'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    requirement_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_DOCUMENT)
    is_mid_session = models.BooleanField(default=False, help_text="If true, assigned mid-session")
    
    def __str__(self):
        return self.title

class RequirementInstance(TimeStampedModel):
    """An instance of a requirement assigned to a specific student"""
    STATUS_PENDING = 'pending'
    STATUS_SUBMITTED = 'submitted'
    STATUS_VERIFIED = 'verified'
    STATUS_REJECTED = 'rejected'
    
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_VERIFIED, 'Verified'),
        (STATUS_REJECTED, 'Rejected'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='compliance_requirements')
    definition = models.ForeignKey(RequirementDefinition, on_delete=models.CASCADE, related_name='instances')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_PENDING)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Admin feedback or notes")

    class Meta:
        # Prevent duplicate assignment of the same requirement to the same student
        # If re-assignment is needed, we might need to handle it (e.g. by deleting the old one or archiving it)
        # But for now, uniqueness seems appropriate to avoid duplicates.
        unique_together = ('student', 'definition') 

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


class RequirementSubmission(TimeStampedModel):
    """A submission for a requirement (file upload or value entry)"""
    instance = models.ForeignKey(RequirementInstance, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='compliance_docs/%Y/%m/', null=True, blank=True)
    value = models.CharField(max_length=255, blank=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Submission for {self.instance}"

class ComplianceActionLog(TimeStampedModel):
    """Audit log for compliance actions"""
    instance = models.ForeignKey(RequirementInstance, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.instance}"
