from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Session(TimeStampedModel):
    """Timetable session linking academic period, group, faculty, and department"""

    academic_period = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="sessions",
        help_text="Academic period this session belongs to",
    )
    group = models.ForeignKey(
        "academics.Group",
        on_delete=models.PROTECT,
        related_name="sessions",
        help_text="Group this session is for",
    )
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sessions",
        help_text="Faculty user assigned to this session",
    )
    department = models.ForeignKey(
        "academics.Department",
        on_delete=models.PROTECT,
        related_name="sessions",
        help_text="Department this session is for (required)",
    )
    starts_at = models.DateTimeField(help_text="Session start time")
    ends_at = models.DateTimeField(help_text="Session end time")

    class Meta:
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["academic_period", "group"]),
            models.Index(fields=["faculty"]),
            models.Index(fields=["starts_at"]),
        ]

    def __str__(self):
        return f"{self.department.name} - {self.group.name} ({self.starts_at})"

