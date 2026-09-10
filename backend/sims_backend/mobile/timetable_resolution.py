"""Shared logic for resolving a student's schedule from the timetable domain.

Used by both `StudentHomeView` (today's schedule) and `StudentTimetableView`
(full week view) so the two endpoints never disagree about what a student's
schedule looks like.

Prefers the normalized `TimetableEntry` model; when a published weekly
timetable for the student's batch/week has no `TimetableEntry` rows yet
(because it predates the new model), falls back to reading the legacy
`TimetableCell` free-text grid so the endpoint isn't empty mid-migration.
"""

from __future__ import annotations

from datetime import date, timedelta

from django.db.models import Q

from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _monday_of(target_date: date) -> date:
    return target_date - timedelta(days=target_date.weekday())


def _entry_to_dict(entry: TimetableEntry, week_start: date) -> dict:
    faculty = entry.section.faculty
    return {
        "id": entry.id,
        "date": (week_start + timedelta(days=entry.day_of_week)).isoformat(),
        "day_of_week": entry.day_of_week,
        "day_name": DAY_NAMES[entry.day_of_week],
        "start_time": entry.start_time.strftime("%H:%M"),
        "end_time": entry.end_time.strftime("%H:%M"),
        "course_code": entry.section.course.code,
        "course_name": entry.section.course.name,
        "faculty_name": (faculty.get_full_name() or faculty.username) if faculty else None,
        "room": entry.room or None,
        "status": entry.status,
        "notes": entry.notes or None,
        "source": "entry",
    }


def _cell_to_dict(cell, week_start: date) -> dict:
    return {
        "id": cell.id,
        "date": (week_start + timedelta(days=cell.day_of_week)).isoformat(),
        "day_of_week": cell.day_of_week,
        "day_name": DAY_NAMES[cell.day_of_week] if cell.day_of_week < len(DAY_NAMES) else None,
        "start_time": None,
        "end_time": None,
        "time_slot": cell.time_slot,
        "course_code": None,
        "course_name": cell.line1 or None,
        "faculty_name": cell.line3 or None,
        "room": cell.line2 or None,
        "status": "SCHEDULED",
        "notes": None,
        "source": "legacy_cell",
    }


def get_student_week_schedule(student, week_start_date: date | None = None) -> dict:
    """Return the published schedule for a student's batch/group for one week.

    `week_start_date` may be any date within the target week; it is
    normalized to that week's Monday. Defaults to the current week.
    """
    week_start = _monday_of(week_start_date or date.today())

    weekly_timetable = (
        WeeklyTimetable.objects.filter(
            batch=student.batch,
            week_start_date=week_start,
            status="published",
        )
        .prefetch_related("entries__section__course", "entries__section__faculty", "entries__group", "cells")
        .first()
    )

    if weekly_timetable is None:
        return {"week_start_date": week_start.isoformat(), "entries": [], "source": "none"}

    entries = list(
        weekly_timetable.entries.filter(Q(group__isnull=True) | Q(group_id=student.group_id))
    )

    if entries:
        return {
            "week_start_date": week_start.isoformat(),
            "entries": [_entry_to_dict(e, week_start) for e in entries],
            "source": "entry",
        }

    # Fall back to the legacy free-text cell grid for this batch/week.
    cells = list(weekly_timetable.cells.all())
    return {
        "week_start_date": week_start.isoformat(),
        "entries": [_cell_to_dict(c, week_start) for c in cells],
        "source": "legacy_cell",
    }


def get_student_today_schedule(student) -> list[dict]:
    """Return today's schedule entries for a student (empty list on Sundays)."""
    today = date.today()
    if today.weekday() == 6:  # Sunday not represented in DAY_CHOICES (0-5)
        return []

    week = get_student_week_schedule(student, week_start_date=today)
    return [e for e in week["entries"] if e["day_of_week"] == today.weekday()]
