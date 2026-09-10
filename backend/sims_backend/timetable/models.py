from django.conf import settings
from django.core.exceptions import ValidationError
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


class WeeklyTimetable(TimeStampedModel):
    """Weekly timetable for a specific batch and week.

    Groups within the batch can be assigned to specific slots/cells,
    which can be indicated in the cell text lines (line1, line2, line3).
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
    ]

    DAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
    ]

    academic_period = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="weekly_timetables",
        help_text="Academic period this timetable belongs to",
    )
    batch = models.ForeignKey(
        "academics.Batch",
        on_delete=models.PROTECT,
        related_name="weekly_timetables",
        help_text="Batch this timetable is for",
    )
    week_start_date = models.DateField(help_text="Monday of the week this timetable covers")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="draft", help_text="Status of the timetable (draft/published)"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_weekly_timetables",
        help_text="Faculty/Admin who created this timetable",
    )

    class Meta:
        ordering = ["week_start_date", "batch"]
        indexes = [
            models.Index(fields=["academic_period", "batch", "week_start_date"]),
            models.Index(fields=["status"]),
            models.Index(fields=["week_start_date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["batch", "academic_period", "week_start_date"],
                name="unique_weekly_timetable_per_batch_period_week",
            )
        ]

    def clean(self):
        """Ensure week_start_date is a Monday"""
        if self.week_start_date.weekday() != 0:  # Monday is 0
            raise ValidationError("week_start_date must be a Monday")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.batch.name} - Week of {self.week_start_date} ({self.status})"


class TimetableEntry(TimeStampedModel):
    """Normalized timetable entry, linked to a Section (course/faculty/group context).

    A student's schedule can be derived from their group via `group` (or,
    when `group` is left blank, the entry applies to the whole batch).
    """

    STATUS_SCHEDULED = "SCHEDULED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_COMPLETED = "COMPLETED"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Completed"),
    ]

    weekly_timetable = models.ForeignKey(
        WeeklyTimetable,
        on_delete=models.CASCADE,
        related_name="entries",
        help_text="Weekly timetable this entry belongs to",
    )
    section = models.ForeignKey(
        "academics.Section",
        on_delete=models.PROTECT,
        related_name="timetable_entries",
        help_text="Section (course + faculty context) taught in this slot",
    )
    group = models.ForeignKey(
        "academics.Group",
        on_delete=models.PROTECT,
        related_name="timetable_entries",
        null=True,
        blank=True,
        help_text="Group this entry is scoped to; blank means it applies to the whole batch",
    )
    day_of_week = models.IntegerField(
        choices=WeeklyTimetable.DAY_CHOICES, help_text="Day of the week (0=Monday, 5=Saturday)"
    )
    start_time = models.TimeField(help_text="Entry start time")
    end_time = models.TimeField(help_text="Entry end time")
    room = models.CharField(max_length=100, blank=True, help_text="Room/venue (free text; no Room resource yet)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    notes = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_timetable_entries",
    )

    class Meta:
        ordering = ["day_of_week", "start_time"]
        verbose_name_plural = "timetable entries"
        indexes = [
            models.Index(fields=["weekly_timetable", "day_of_week"]),
            models.Index(fields=["group"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        errors = {}
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            errors["end_time"] = "end_time must be after start_time"

        if self.section_id and self.weekly_timetable_id:
            if self.section.academic_period_id != self.weekly_timetable.academic_period_id:
                errors["section"] = "Section's academic period must match the weekly timetable's academic period"

        if self.group_id and self.weekly_timetable_id:
            if self.group.batch_id != self.weekly_timetable.batch_id:
                errors["group"] = "Group's batch must match the weekly timetable's batch"

        if errors:
            raise ValidationError(errors)

        if self.weekly_timetable_id and self.day_of_week is not None and self.start_time and self.end_time:
            overlapping = TimetableEntry.objects.filter(
                weekly_timetable_id=self.weekly_timetable_id,
                day_of_week=self.day_of_week,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            ).exclude(status=self.STATUS_CANCELLED)
            if self.pk:
                overlapping = overlapping.exclude(pk=self.pk)

            if self.section_id and overlapping.filter(section__faculty_id=self.section.faculty_id).exists():
                if self.section.faculty_id is not None:
                    raise ValidationError("This faculty member already has an overlapping entry at this time")

            if self.group_id and overlapping.filter(group_id=self.group_id).exists():
                raise ValidationError("This group already has an overlapping entry at this time")

            if self.room and overlapping.filter(room=self.room).exists():
                raise ValidationError("This room already has an overlapping entry at this time")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.section} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"
