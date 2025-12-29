from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from core.models import TimeStampedModel


class Exam(TimeStampedModel):
    """Exam with component-based structure and passing logic"""

    PASSING_MODE_TOTAL_ONLY = "TOTAL_ONLY"
    PASSING_MODE_COMPONENT_WISE = "COMPONENT_WISE"
    PASSING_MODE_HYBRID = "HYBRID"

    PASSING_MODE_CHOICES = [
        (PASSING_MODE_TOTAL_ONLY, "Total Only"),
        (PASSING_MODE_COMPONENT_WISE, "Component Wise"),
        (PASSING_MODE_HYBRID, "Hybrid"),
    ]

    academic_period = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="exams",
        help_text="Academic period this exam belongs to (required)",
    )
    department = models.ForeignKey(
        "academics.Department",
        on_delete=models.PROTECT,
        related_name="exams",
        null=True,
        blank=True,
        help_text="Department for this exam (nullable for combined exams)",
    )
    title = models.CharField(
        max_length=255,
        help_text="Exam title",
    )
    exam_type = models.CharField(
        max_length=128,
        blank=True,
        help_text="Type of exam (e.g., 'Midterm', 'Final', 'Quiz')",
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Scheduled date and time for the exam",
    )
    published = models.BooleanField(
        default=False,
        help_text="Whether this exam is published",
    )
    version = models.IntegerField(
        default=1,
        help_text="Version number for audit trail",
    )
    passing_mode = models.CharField(
        max_length=32,
        choices=PASSING_MODE_CHOICES,
        default=PASSING_MODE_TOTAL_ONLY,
        help_text="Mode for determining pass/fail",
    )
    pass_total_marks = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Minimum total marks required to pass",
    )
    pass_total_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum total percentage required to pass",
    )
    fail_if_any_component_fail = models.BooleanField(
        default=False,
        help_text="If True, student fails if any mandatory component fails",
    )

    class Meta:
        ordering = ["-scheduled_at", "title"]
        indexes = [
            models.Index(fields=["academic_period"]),
            models.Index(fields=["department"]),
            models.Index(fields=["published"]),
        ]

    def __str__(self):
        dept_str = f" - {self.department.name}" if self.department else ""
        return f"{self.title}{dept_str} ({self.academic_period.name})"


class ExamComponent(TimeStampedModel):
    """Component of an exam with individual passing criteria"""

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="components",
        help_text="Exam this component belongs to",
    )
    name = models.CharField(
        max_length=255,
        help_text="Component name (e.g., 'Written', 'Practical', 'Viva')",
    )
    sequence = models.IntegerField(
        default=1,
        help_text="Order/sequence of this component",
    )
    department = models.ForeignKey(
        "academics.Department",
        on_delete=models.PROTECT,
        related_name="exam_components",
        null=True,
        blank=True,
        help_text="Department for this component (nullable)",
    )
    max_marks = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Maximum marks for this component",
    )
    pass_marks = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Minimum marks required to pass this component",
    )
    pass_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum percentage required to pass this component",
    )
    is_mandatory_to_pass = models.BooleanField(
        default=False,
        help_text="Whether this component must be passed for overall pass",
    )

    class Meta:
        ordering = ["exam", "sequence", "name"]
        unique_together = [("exam", "sequence")]
        indexes = [
            models.Index(fields=["exam", "sequence"]),
        ]

    def __str__(self):
        return f"{self.exam.title} - {self.name} ({self.sequence})"

