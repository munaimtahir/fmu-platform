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


class AttendanceInputJob(TimeStampedModel):
    """Tracks imports/uploads for attendance workflows."""

    TYPE_CSV = "CSV"
    TYPE_SHEET = "SHEET"

    STATUS_DRAFT = "DRAFT"
    STATUS_COMMITTED = "COMMITTED"

    INPUT_TYPE_CHOICES = [
        (TYPE_CSV, "CSV Upload"),
        (TYPE_SHEET, "Scanned Sheet"),
    ]
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_COMMITTED, "Committed"),
    ]

    session = models.ForeignKey(
        "timetable.Session",
        on_delete=models.CASCADE,
        related_name="attendance_input_jobs",
        help_text="Session this upload is associated with",
    )
    date = models.DateField(
        help_text="Target attendance date",
        default=timezone.localdate,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_uploads",
    )
    input_type = models.CharField(max_length=12, choices=INPUT_TYPE_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    original_filename = models.CharField(max_length=255, blank=True)
    file_fingerprint = models.CharField(max_length=64, blank=True)
    summary = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["input_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.input_type} upload for {self.session} on {self.date}"


class BiometricDevice(TimeStampedModel):
    """Represents a biometric device (placeholder for future integration)."""

    name = models.CharField(max_length=128)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class BiometricPunch(TimeStampedModel):
    """Raw punches received from biometric devices."""

    device = models.ForeignKey(
        BiometricDevice, on_delete=models.SET_NULL, null=True, related_name="punches"
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="biometric_punches",
    )
    punched_at = models.DateTimeField(default=timezone.now)
    raw_identifier = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-punched_at"]
        indexes = [
            models.Index(fields=["punched_at"]),
            models.Index(fields=["student"]),
        ]

    def __str__(self):
        return f"{self.student.reg_no} punch at {self.punched_at}"
