from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError

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
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
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
    week_start_date = models.DateField(
        help_text="Monday of the week this timetable covers"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Status of the timetable (draft/published)"
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
                fields=["batch", "week_start_date"],
                name="unique_weekly_timetable_per_batch_week"
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


class TimetableCell(TimeStampedModel):
    """Individual cell in a weekly timetable grid"""
    
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
    ]

    weekly_timetable = models.ForeignKey(
        WeeklyTimetable,
        on_delete=models.CASCADE,
        related_name="cells",
        help_text="Weekly timetable this cell belongs to",
    )
    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
        help_text="Day of the week (0=Monday, 5=Saturday)"
    )
    time_slot = models.CharField(
        max_length=50,
        help_text="Time slot identifier (e.g., '09:00-10:00')"
    )
    line1 = models.CharField(
        max_length=200,
        blank=True,
        help_text="First line of cell content (e.g., course name, or groups like 'Group A, Group B')"
    )
    line2 = models.CharField(
        max_length=200,
        blank=True,
        help_text="Second line of cell content (e.g., room number, or additional groups)"
    )
    line3 = models.CharField(
        max_length=200,
        blank=True,
        help_text="Third line of cell content (e.g., faculty name, or additional info)"
    )

    class Meta:
        ordering = ["day_of_week", "time_slot"]
        indexes = [
            models.Index(fields=["weekly_timetable", "day_of_week", "time_slot"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["weekly_timetable", "day_of_week", "time_slot"],
                name="unique_cell_per_timetable_day_time"
            )
        ]

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.time_slot} - {self.line1 or 'Empty'}"

