from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class Attendance(TimeStampedModel):
    """Attendance record for a student in a session"""

    STATUS_PRESENT = "PRESENT"
    STATUS_ABSENT = "ABSENT"
    STATUS_LATE = "LATE"
    STATUS_LEAVE = "LEAVE"

    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_LATE, "Late"),
        (STATUS_LEAVE, "Leave"),
    ]

    session = models.ForeignKey(
        "timetable.Session",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        help_text="Session this attendance is for",
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        help_text="Student this attendance is for",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PRESENT,
        help_text="Attendance status",
    )
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="marked_attendances",
        null=True,
        help_text="User who marked this attendance",
    )
    marked_at = models.DateTimeField(
        default=timezone.now,
        help_text="When this attendance was marked",
    )

    class Meta:
        unique_together = [("session", "student")]
        ordering = ["-marked_at"]
        indexes = [
            models.Index(fields=["session", "student"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.student.reg_no} - {self.session} - {self.get_status_display()}"
