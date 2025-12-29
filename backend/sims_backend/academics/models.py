from django.db import models

from core.models import TimeStampedModel


class Program(TimeStampedModel):
    """Academic program"""

    name = models.CharField(
        max_length=128,
        unique=True,
        help_text="Program name (e.g., MBBS, BDS, MD, etc.)",
    )
    description = models.TextField(blank=True, help_text="Program description")
    is_active = models.BooleanField(
        default=True, help_text="Whether this program is currently active"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Batch(TimeStampedModel):
    """Batch belonging to a Program"""

    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name="batches",
        help_text="Program this batch belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Batch name (e.g., '2024 Batch', 'Fall 2024')",
    )
    start_year = models.PositiveSmallIntegerField(
        help_text="Batch start year"
    )

    class Meta:
        ordering = ["program", "start_year"]
        unique_together = [("program", "name")]

    def __str__(self):
        return f"{self.program.name} - {self.name}"


class AcademicPeriod(TimeStampedModel):
    """Academic period with hierarchical structure (YEAR / BLOCK / MODULE)"""

    PERIOD_TYPE_YEAR = "YEAR"
    PERIOD_TYPE_BLOCK = "BLOCK"
    PERIOD_TYPE_MODULE = "MODULE"

    PERIOD_TYPE_CHOICES = [
        (PERIOD_TYPE_YEAR, "Year"),
        (PERIOD_TYPE_BLOCK, "Block"),
        (PERIOD_TYPE_MODULE, "Module"),
    ]

    period_type = models.CharField(
        max_length=16,
        choices=PERIOD_TYPE_CHOICES,
        help_text="Type of academic period",
    )
    name = models.CharField(
        max_length=128,
        help_text="Period name (e.g., 'Year 1', 'Block 1', 'Module A')",
    )
    parent_period = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="child_periods",
        null=True,
        blank=True,
        help_text="Parent period for hierarchical structure (YEAR -> BLOCK -> MODULE)",
    )
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Period start date",
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Period end date",
    )

    class Meta:
        ordering = ["period_type", "name"]

    def __str__(self):
        parent_str = f" ({self.parent_period})" if self.parent_period else ""
        return f"{self.get_period_type_display()}: {self.name}{parent_str}"


class Group(TimeStampedModel):
    """Group belonging to a Batch"""

    batch = models.ForeignKey(
        Batch,
        on_delete=models.PROTECT,
        related_name="groups",
        help_text="Batch this group belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Group name (e.g., 'Group A', 'Section 1')",
    )

    class Meta:
        ordering = ["batch", "name"]
        unique_together = [("batch", "name")]

    def __str__(self):
        return f"{self.batch} - {self.name}"


class Department(TimeStampedModel):
    """Department representing subject/department (parallel to Program)"""

    name = models.CharField(
        max_length=128,
        unique=True,
        help_text="Department name (e.g., 'Anatomy', 'Medicine', 'Surgery')",
    )
    code = models.CharField(
        max_length=32,
        unique=True,
        blank=True,
        help_text="Department code (e.g., 'ANAT', 'MED')",
    )
    description = models.TextField(blank=True, help_text="Department description")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name
