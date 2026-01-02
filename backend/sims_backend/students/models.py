from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Student(TimeStampedModel):
    """Student record - core entity of the system"""

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_GRADUATED = "graduated"
    STATUS_SUSPENDED = "suspended"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_GRADUATED, "Graduated"),
        (STATUS_SUSPENDED, "Suspended"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student",
        help_text="Linked user account (optional until account is created)",
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

    class Meta:
        ordering = ["reg_no"]
        indexes = [
            models.Index(fields=["program", "batch", "group"]),
            models.Index(fields=["status"]),
            models.Index(fields=["reg_no"]),
        ]

    def __str__(self) -> str:
        return f"{self.reg_no} - {self.name} ({self.program.name}, {self.batch.name})"

