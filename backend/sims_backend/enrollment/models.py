"""
Enrollment module models - Academic binding between students and sections/terms.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

from core.models import TimeStampedModel


class Enrollment(TimeStampedModel):
    """Enrollment record binding a student to a section."""

    STATUS_ACTIVE = "active"
    STATUS_DROPPED = "dropped"
    STATUS_COMPLETED = "completed"
    STATUS_WITHDRAWN = "withdrawn"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_DROPPED, "Dropped"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_WITHDRAWN, "Withdrawn"),
    ]

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="enrollments",
        help_text="Student enrolled",
    )
    section = models.ForeignKey(
        "academics.Section",
        on_delete=models.CASCADE,
        related_name="enrollments",
        help_text="Section enrolled in",
    )
    academic_period = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.CASCADE,
        related_name="enrollments",
        help_text="Academic period of enrollment",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        help_text="Enrollment status",
    )
    enrolled_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the student was enrolled",
    )
    enrolled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enrollments_created",
        help_text="User who created this enrollment",
    )
    dropped_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the enrollment was dropped",
    )
    drop_reason = models.TextField(
        blank=True,
        help_text="Reason for dropping",
    )
    grade = models.CharField(
        max_length=10,
        blank=True,
        help_text="Final grade (if completed)",
    )

    class Meta:
        ordering = ["-enrolled_at"]
        unique_together = [["student", "section", "academic_period"]]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["section", "status"]),
            models.Index(fields=["academic_period", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.student.reg_no} → {self.section} ({self.get_status_display()})"

    @classmethod
    def enroll_student(
        cls,
        student,
        section,
        academic_period,
        enrolled_by=None
    ) -> "Enrollment":
        """
        Enroll a student in a section with capacity and term validation.
        Uses transaction and select_for_update for concurrency safety.
        """
        from sims_backend.academics.models import AcademicPeriod

        # Check if term is open
        if academic_period.status == AcademicPeriod.STATUS_CLOSED:
            raise EnrollmentError(
                code="TERM_CLOSED",
                message="Cannot enroll in a closed term"
            )

        if not academic_period.is_enrollment_open:
            raise EnrollmentError(
                code="ENROLLMENT_CLOSED",
                message="Enrollment is closed for this term"
            )

        with transaction.atomic():
            # Lock the section row for update
            from sims_backend.academics.models import Section
            section_locked = Section.objects.select_for_update().get(pk=section.pk)

            # Check capacity
            current_count = cls.objects.filter(
                section=section_locked,
                academic_period=academic_period,
                status=cls.STATUS_ACTIVE
            ).count()

            if current_count >= section_locked.capacity:
                raise EnrollmentError(
                    code="CAPACITY_EXCEEDED",
                    message=f"Section is at capacity ({section_locked.capacity})"
                )

            # Check for duplicate enrollment
            if cls.objects.filter(
                student=student,
                section=section_locked,
                academic_period=academic_period
            ).exists():
                raise EnrollmentError(
                    code="DUPLICATE_ENROLLMENT",
                    message="Student is already enrolled in this section"
                )

            # Create enrollment
            enrollment = cls.objects.create(
                student=student,
                section=section_locked,
                academic_period=academic_period,
                enrolled_by=enrolled_by,
            )

            return enrollment

    def drop(self, reason: str = "") -> None:
        """Drop this enrollment."""
        if self.status != self.STATUS_ACTIVE:
            raise EnrollmentError(
                code="INVALID_STATUS",
                message=f"Cannot drop enrollment with status {self.status}"
            )

        self.status = self.STATUS_DROPPED
        self.dropped_at = timezone.now()
        self.drop_reason = reason
        self.save()

    def complete(self, grade: str) -> None:
        """Mark this enrollment as completed with a grade."""
        if self.status != self.STATUS_ACTIVE:
            raise EnrollmentError(
                code="INVALID_STATUS",
                message=f"Cannot complete enrollment with status {self.status}"
            )

        self.status = self.STATUS_COMPLETED
        self.grade = grade
        self.save()


class EnrollmentError(Exception):
    """Exception for enrollment-related errors."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
