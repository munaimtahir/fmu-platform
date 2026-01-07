from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Student(TimeStampedModel):
    """Student record - core entity of the system"""

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_GRADUATED = "graduated"
    STATUS_SUSPENDED = "suspended"
    STATUS_ON_LEAVE = "on_leave"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_GRADUATED, "Graduated"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_ON_LEAVE, "On Leave"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student",
        help_text="Linked user account (optional until account is created)",
    )
    person = models.OneToOneField(
        "people.Person",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student",
        help_text="Linked person record for identity data",
    )
    reg_no = models.CharField(
        max_length=32,
        unique=True,
        help_text="Student registration number",
    )
    name = models.CharField(max_length=255, help_text="Full name of the student")
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        related_name="students",
        help_text="Program the student is enrolled in",
    )
    batch = models.ForeignKey(
        "academics.Batch",
        on_delete=models.PROTECT,
        related_name="students",
        help_text="Batch the student belongs to",
    )
    group = models.ForeignKey(
        "academics.Group",
        on_delete=models.PROTECT,
        related_name="students",
        help_text="Group the student belongs to",
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        help_text="Current status of the student",
    )
    email = models.EmailField(
        blank=True,
        help_text="Student email address",
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Student phone number",
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Student date of birth",
    )
    # Academic binding fields
    enrollment_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Year of enrollment",
    )
    expected_graduation_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Expected year of graduation",
    )
    actual_graduation_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Actual year of graduation (if graduated)",
    )

    class Meta:
        ordering = ["reg_no"]
        indexes = [
            models.Index(fields=["program", "batch", "group"]),
            models.Index(fields=["status"]),
            models.Index(fields=["reg_no"]),
            models.Index(fields=["enrollment_year"]),
        ]

    def __str__(self) -> str:
        return f"{self.reg_no} - {self.name} ({self.program.name}, {self.batch.name})"


class LeavePeriod(TimeStampedModel):
    """Leave period for a student"""

    TYPE_MEDICAL = "medical"
    TYPE_PERSONAL = "personal"
    TYPE_ACADEMIC = "academic"
    TYPE_ABSENCE = "absence"

    TYPE_CHOICES = [
        (TYPE_MEDICAL, "Medical Leave"),
        (TYPE_PERSONAL, "Personal Leave"),
        (TYPE_ACADEMIC, "Academic Leave"),
        (TYPE_ABSENCE, "Absence Leave"),
    ]

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_COMPLETED = "completed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_COMPLETED, "Completed"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="leave_periods",
        help_text="Student on leave",
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of leave",
    )
    start_date = models.DateField(
        help_text="Leave start date",
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Leave end date (null for ongoing leave)",
    )
    reason = models.TextField(
        help_text="Reason for leave",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leaves",
        help_text="User who approved the leave",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Leave status",
    )
    counts_toward_graduation = models.BooleanField(
        default=True,
        help_text="Whether this leave counts toward time-to-graduation (absence leave excluded)",
    )

    class Meta:
        ordering = ["-start_date"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.student.reg_no} - {self.get_type_display()} ({self.start_date})"

    def save(self, *args, **kwargs):
        # Absence leave does not count toward graduation
        if self.type == self.TYPE_ABSENCE:
            self.counts_toward_graduation = False
        super().save(*args, **kwargs)

