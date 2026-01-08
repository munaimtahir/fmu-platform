from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class ResultHeader(TimeStampedModel):
    """Result header for a student in an exam"""

    OUTCOME_PASS = "PASS"
    OUTCOME_FAIL = "FAIL"
    OUTCOME_PENDING = "PENDING"

    OUTCOME_CHOICES = [
        (OUTCOME_PASS, "Pass"),
        (OUTCOME_FAIL, "Fail"),
        (OUTCOME_PENDING, "Pending"),
    ]

    STATUS_DRAFT = "DRAFT"
    STATUS_VERIFIED = "VERIFIED"
    STATUS_PUBLISHED = "PUBLISHED"
    STATUS_FROZEN = "FROZEN"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_FROZEN, "Frozen"),
    ]

    exam = models.ForeignKey(
        "exams.Exam",
        on_delete=models.PROTECT,
        related_name="result_headers",
        help_text="Exam this result is for",
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="result_headers",
        help_text="Student this result is for",
    )
    total_obtained = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Total marks obtained",
    )
    total_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Total maximum marks",
    )
    final_outcome = models.CharField(
        max_length=16,
        choices=OUTCOME_CHOICES,
        default=OUTCOME_PENDING,
        help_text="Final pass/fail outcome (computed)",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        help_text="Workflow status",
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the result was published",
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_results",
        help_text="User who published the result",
    )
    frozen_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the result was frozen",
    )
    frozen_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="frozen_results",
        help_text="User who froze the result",
    )

    class Meta:
        unique_together = [("exam", "student")]
        ordering = ["exam", "student"]
        indexes = [
            models.Index(fields=["exam", "student"]),
            models.Index(fields=["status"]),
            models.Index(fields=["final_outcome"]),
        ]

    def __str__(self):
        return f"{self.student.reg_no} - {self.exam.title} ({self.get_status_display()})"

    @property
    def is_editable(self) -> bool:
        """Check if the result can be edited."""
        return self.status == self.STATUS_DRAFT

    @property
    def is_publishable(self) -> bool:
        """Check if the result can be published."""
        return self.status in [self.STATUS_DRAFT, self.STATUS_VERIFIED]

    @property
    def is_freezable(self) -> bool:
        """Check if the result can be frozen."""
        return self.status == self.STATUS_PUBLISHED

    def publish(self, user) -> None:
        """Publish the result."""
        if not self.is_publishable:
            raise ResultError(
                code="NOT_PUBLISHABLE",
                message=f"Cannot publish result with status {self.status}"
            )
        self.status = self.STATUS_PUBLISHED
        self.published_at = timezone.now()
        self.published_by = user
        self.save()

    def freeze(self, user) -> None:
        """Freeze the result (make immutable)."""
        if not self.is_freezable:
            raise ResultError(
                code="NOT_FREEZABLE",
                message=f"Cannot freeze result with status {self.status}"
            )
        self.status = self.STATUS_FROZEN
        self.frozen_at = timezone.now()
        self.frozen_by = user
        self.save()


class ResultError(Exception):
    """Exception for result-related errors."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class ResultComponentEntry(TimeStampedModel):
    """Individual component entry within a result header"""

    OUTCOME_PASS = "PASS"
    OUTCOME_FAIL = "FAIL"
    OUTCOME_NA = "NA"

    OUTCOME_CHOICES = [
        (OUTCOME_PASS, "Pass"),
        (OUTCOME_FAIL, "Fail"),
        (OUTCOME_NA, "Not Applicable"),
    ]

    result_header = models.ForeignKey(
        ResultHeader,
        on_delete=models.CASCADE,
        related_name="component_entries",
        help_text="Result header this entry belongs to",
    )
    exam_component = models.ForeignKey(
        "exams.ExamComponent",
        on_delete=models.PROTECT,
        related_name="result_entries",
        help_text="Exam component this entry is for",
    )
    marks_obtained = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Marks obtained in this component",
    )
    component_outcome = models.CharField(
        max_length=16,
        choices=OUTCOME_CHOICES,
        default=OUTCOME_NA,
        help_text="Pass/fail outcome for this component (computed)",
    )

    class Meta:
        unique_together = [("result_header", "exam_component")]
        ordering = ["result_header", "exam_component__sequence"]
        indexes = [
            models.Index(fields=["result_header", "exam_component"]),
        ]

    def __str__(self):
        return f"{self.result_header} - {self.exam_component.name} ({self.marks_obtained})"
