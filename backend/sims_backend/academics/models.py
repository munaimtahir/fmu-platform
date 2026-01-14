from django.db import models

from core.models import TimeStampedModel


class Program(TimeStampedModel):
    """Academic program with structure management"""

    STRUCTURE_TYPE_YEARLY = "YEARLY"
    STRUCTURE_TYPE_SEMESTER = "SEMESTER"
    STRUCTURE_TYPE_CUSTOM = "CUSTOM"

    STRUCTURE_TYPE_CHOICES = [
        (STRUCTURE_TYPE_YEARLY, "Yearly"),
        (STRUCTURE_TYPE_SEMESTER, "Semester"),
        (STRUCTURE_TYPE_CUSTOM, "Custom"),
    ]

    name = models.CharField(
        max_length=128,
        unique=True,
        help_text="Program name (e.g., MBBS, BDS, MD, etc.)",
    )
    description = models.TextField(blank=True, help_text="Program description")
    is_active = models.BooleanField(
        default=True, help_text="Whether this program is currently active"
    )
    # New structure fields
    structure_type = models.CharField(
        max_length=16,
        choices=STRUCTURE_TYPE_CHOICES,
        default=STRUCTURE_TYPE_YEARLY,
        help_text="Program structure type",
    )
    is_finalized = models.BooleanField(
        default=False,
        help_text="Whether program structure is finalized (locks structure fields)",
    )
    period_length_months = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Period length in months (for CUSTOM structure_type)",
    )
    total_periods = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Total number of periods (for CUSTOM structure_type)",
    )

    class Meta:
        ordering = ["name"]
        permissions = [
            ("finalize_program", "Can finalize program structure"),
            ("manage_structure", "Can manage program structure"),
        ]

    def __str__(self):
        return self.name


class Batch(TimeStampedModel):
    """
    Batch belonging to a Program.
    
    Note: The start_year field represents the graduation year, not the intake year.
    For example, students enrolling in 2026 in a 5-year MBBS program would graduate in 2031,
    so the batch would have start_year=2031 (represented as 'b31' in usernames/emails).
    """

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
        help_text="Graduation year for this batch (not intake year). Example: Students enrolling in 2026 for a 5-year program would have start_year=2031."
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

    STATUS_OPEN = "OPEN"
    STATUS_CLOSED = "CLOSED"

    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_CLOSED, "Closed"),
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
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
        help_text="Period status (OPEN allows enrollment, CLOSED blocks it)",
    )
    is_enrollment_open = models.BooleanField(
        default=True,
        help_text="Whether enrollment is open for this period",
    )

    class Meta:
        ordering = ["period_type", "name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["period_type", "status"]),
        ]

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
    """Department representing subject/department with hierarchical structure"""

    name = models.CharField(
        max_length=128,
        help_text="Department name (e.g., 'Anatomy', 'Medicine', 'Surgery')",
    )
    code = models.CharField(
        max_length=32,
        blank=True,
        help_text="Department code (e.g., 'ANAT', 'MED')",
    )
    description = models.TextField(blank=True, help_text="Department description")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="children",
        null=True,
        blank=True,
        help_text="Parent department for hierarchical structure",
    )

    class Meta:
        ordering = ["name"]
        unique_together = [("name", "parent")]  # Same name allowed if different parent

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name

    def get_ancestors(self):
        """Get all ancestor departments"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def is_descendant_of(self, department):
        """Check if this department is a descendant of the given department"""
        return department in self.get_ancestors()


class Course(TimeStampedModel):
    """Course/Subject in an academic program"""

    code = models.CharField(
        max_length=32,
        unique=True,
        help_text="Course code (e.g., 'ANAT-101', 'PHYS-201')",
    )
    name = models.CharField(
        max_length=255,
        help_text="Course name (e.g., 'Human Anatomy', 'Physiology')",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="courses",
        help_text="Department offering this course",
    )
    academic_period = models.ForeignKey(
        AcademicPeriod,
        on_delete=models.PROTECT,
        related_name="courses",
        null=True,
        blank=True,
        help_text="Academic period this course belongs to (optional)",
    )
    credits = models.PositiveSmallIntegerField(
        default=3,
        help_text="Credit hours for this course",
    )

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Section(TimeStampedModel):
    """Section/Class for a course with faculty and group assignment"""

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="sections",
        help_text="Course this section belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Section name (e.g., 'Section A', 'Morning Batch')",
    )
    academic_period = models.ForeignKey(
        AcademicPeriod,
        on_delete=models.PROTECT,
        related_name="sections",
        help_text="Academic period this section belongs to",
    )
    faculty = models.ForeignKey(
        "auth.User",
        on_delete=models.PROTECT,
        related_name="teaching_sections",
        null=True,
        blank=True,
        help_text="Faculty assigned to this section (optional)",
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.PROTECT,
        related_name="sections",
        null=True,
        blank=True,
        help_text="Group this section is assigned to (optional)",
    )
    capacity = models.PositiveSmallIntegerField(
        default=50,
        help_text="Maximum number of students",
    )

    class Meta:
        ordering = ["course", "name"]
        unique_together = [("course", "academic_period", "name")]

    def __str__(self):
        return f"{self.course.code} - {self.name} ({self.academic_period.name})"


# New Academics Module Models

class Period(TimeStampedModel):
    """Period within a Program"""

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="periods",
        help_text="Program this period belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Period name (e.g., 'Year 1', 'Semester 1', 'Period 1')",
    )
    order = models.PositiveSmallIntegerField(
        help_text="Order/sequence of this period within the program",
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
        ordering = ["program", "order"]
        unique_together = [("program", "name"), ("program", "order")]

    def __str__(self):
        return f"{self.program.name} - {self.name}"


class Track(TimeStampedModel):
    """Track within a Program (parallel tracks)"""

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="tracks",
        help_text="Program this track belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Track name (e.g., 'Track A', 'Clinical Track')",
    )
    description = models.TextField(blank=True, help_text="Track description")

    class Meta:
        ordering = ["program", "name"]
        unique_together = [("program", "name")]

    def __str__(self):
        return f"{self.program.name} - {self.name}"


class LearningBlock(TimeStampedModel):
    """Learning block (Integrated or Rotation) scheduled in a Period and Track"""

    BLOCK_TYPE_INTEGRATED = "INTEGRATED_BLOCK"
    BLOCK_TYPE_ROTATION = "ROTATION_BLOCK"

    BLOCK_TYPE_CHOICES = [
        (BLOCK_TYPE_INTEGRATED, "Integrated Block"),
        (BLOCK_TYPE_ROTATION, "Rotation Block"),
    ]

    period = models.ForeignKey(
        Period,
        on_delete=models.CASCADE,
        related_name="blocks",
        help_text="Period this block belongs to",
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name="blocks",
        help_text="Track this block belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Block name",
    )
    block_type = models.CharField(
        max_length=32,
        choices=BLOCK_TYPE_CHOICES,
        help_text="Type of learning block",
    )
    start_date = models.DateField(
        help_text="Block start date",
    )
    end_date = models.DateField(
        help_text="Block end date",
    )
    # Department fields (for ROTATION_BLOCK only)
    primary_department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="primary_rotation_blocks",
        null=True,
        blank=True,
        help_text="Primary department (required for ROTATION_BLOCK)",
    )
    sub_department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="sub_rotation_blocks",
        null=True,
        blank=True,
        help_text="Sub-department (must be child of primary_department if present)",
    )

    class Meta:
        ordering = ["period", "track", "start_date"]

    def __str__(self):
        return f"{self.period.name} - {self.track.name} - {self.name}"


class Module(TimeStampedModel):
    """Module within an Integrated Learning Block"""

    block = models.ForeignKey(
        LearningBlock,
        on_delete=models.CASCADE,
        related_name="modules",
        help_text="Integrated block this module belongs to",
    )
    name = models.CharField(
        max_length=128,
        help_text="Module name",
    )
    description = models.TextField(blank=True, help_text="Module description")
    order = models.PositiveSmallIntegerField(
        help_text="Order/sequence of this module within the block",
    )

    class Meta:
        ordering = ["block", "order"]
        unique_together = [("block", "name"), ("block", "order")]

    def __str__(self):
        return f"{self.block.name} - {self.name}"
