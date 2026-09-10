"""
Management command to seed WeeklyTimetable/TimetableEntry demo data for the
Playwright timetable e2e specs (frontend/e2e/tests/faculty/timetable.spec.ts
and frontend/e2e/tests/student/timetable.spec.ts).

No existing seed command creates WeeklyTimetable/TimetableEntry rows, and no
existing seed command creates the `pilot_faculty`/`pilot_student` accounts
referenced by the Playwright suite's role fixtures either (see
docs/_freeze/06_PILOT_BASELINE_POLICY.md) — they have historically been
created manually against a persistent baseline DB. This command idempotently
creates both: the two pilot accounts (if missing) and a minimal academic
structure (Program/Batch/AcademicPeriod/Group/Department/Course/Section) tied
to them, plus three WeeklyTimetable weeks:

  1. A DRAFT week (next week) with two TimetableEntry rows — used by the
     faculty spec to exercise "cancel entry" via EntriesPanel, and as a
     target for "add entry" via EntryForm.
  2. A second DRAFT week (two weeks out) with exactly 3 TimetableEntry rows
     per day (18 total) already satisfying the "exactly 3 scheduled periods
     per day" publish rule — used by the faculty spec to exercise Publish
     without having to add 18 entries through the UI first.
  3. A PUBLISHED week (the current week) with TimetableEntry rows on two
     days that exclude today's weekday — used by the student spec so the
     "Today" tab reliably shows the empty state ("No classes scheduled for
     today.") while "This Week" shows real entries, and adjacent
     (unpublished) weeks reliably show the other empty state ("No published
     schedule for this week yet.").

Safe to run repeatedly (check-then-create for every object), matching the
idempotency pattern of `seed_demo`.
"""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.core.management.base import BaseCommand
from django.db import transaction

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group, Program, Section
from sims_backend.students.models import Student
from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable

User = get_user_model()

DEFAULT_TIME_SLOTS = [
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
]


def _monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


class Command(BaseCommand):
    help = "Seed WeeklyTimetable/TimetableEntry demo data (and pilot_faculty/pilot_student accounts) for e2e tests"

    @transaction.atomic
    def handle(self, *args, **options):
        faculty_group, _ = AuthGroup.objects.get_or_create(name="FACULTY")
        student_group, _ = AuthGroup.objects.get_or_create(name="STUDENT")

        pilot_faculty = self._get_or_create_user(
            username="pilot_faculty",
            email="pilot_faculty@local.test",
            first_name="Pilot",
            last_name="Faculty",
            group=faculty_group,
        )
        pilot_student_user = self._get_or_create_user(
            username="pilot_student",
            email="pilot_student@local.test",
            first_name="Pilot",
            last_name="Student",
            group=student_group,
        )

        program, _ = Program.objects.get_or_create(
            name="Timetable E2E Program",
            defaults={"description": "Program used only by Playwright timetable e2e specs", "is_active": True},
        )
        batch, _ = Batch.objects.get_or_create(
            program=program,
            name="Timetable E2E Batch",
            defaults={"start_year": date.today().year + 5, "is_active": True},
        )
        group, _ = Group.objects.get_or_create(batch=batch, name="Timetable E2E Group A")

        today = date.today()
        period_start = _monday_of(today) - timedelta(weeks=1)
        period_end = _monday_of(today) + timedelta(weeks=4, days=6)
        academic_period, _ = AcademicPeriod.objects.get_or_create(
            period_type=AcademicPeriod.PERIOD_TYPE_BLOCK,
            name="Timetable E2E Period",
            defaults={"start_date": period_start, "end_date": period_end, "status": AcademicPeriod.STATUS_OPEN},
        )
        # Keep dates current even if the period already existed from a
        # previous (older) run of this command.
        if academic_period.start_date != period_start or academic_period.end_date != period_end:
            academic_period.start_date = period_start
            academic_period.end_date = period_end
            academic_period.save(update_fields=["start_date", "end_date"])

        department, _ = Department.objects.get_or_create(name="Timetable E2E Department", parent=None)
        course, _ = Course.objects.get_or_create(
            code="TTD-101",
            defaults={
                "name": "Timetable E2E Course",
                "department": department,
                "academic_period": academic_period,
            },
        )
        section, _ = Section.objects.get_or_create(
            course=course,
            academic_period=academic_period,
            name="Section A",
            defaults={"faculty": pilot_faculty, "group": group, "capacity": 50},
        )
        if section.faculty_id != pilot_faculty.id or section.group_id != group.id:
            section.faculty = pilot_faculty
            section.group = group
            section.save(update_fields=["faculty", "group"])

        student, created = Student.objects.get_or_create(
            reg_no="TTD-E2E-001",
            defaults={
                "user": pilot_student_user,
                "name": pilot_student_user.get_full_name() or pilot_student_user.username,
                "program": program,
                "batch": batch,
                "group": group,
                "status": Student.STATUS_ACTIVE,
                "email": pilot_student_user.email,
            },
        )
        if not created and (student.user_id != pilot_student_user.id or student.batch_id != batch.id):
            student.user = pilot_student_user
            student.program = program
            student.batch = batch
            student.group = group
            student.save(update_fields=["user", "program", "batch", "group"])

        entries_week_start = _monday_of(today) + timedelta(weeks=1)
        publish_week_start = _monday_of(today) + timedelta(weeks=2)
        published_week_start = _monday_of(today)

        entries_week = self._get_or_create_weekly_timetable(
            academic_period, batch, entries_week_start, "draft", pilot_faculty
        )
        self._ensure_entries(
            entries_week,
            section,
            group,
            pilot_faculty,
            [
                (0, "09:00", "10:00", "Room 101"),
                (2, "11:00", "12:00", "Room 102"),
            ],
        )

        publish_week = self._get_or_create_weekly_timetable(
            academic_period, batch, publish_week_start, "draft", pilot_faculty
        )
        self._ensure_publishable_entries(publish_week, section, group, pilot_faculty)

        today_weekday = today.weekday()  # 0=Mon..6=Sun
        candidate_days = [d for d in range(6) if d != today_weekday]
        published_week = self._get_or_create_weekly_timetable(
            academic_period, batch, published_week_start, "published", pilot_faculty
        )
        self._ensure_entries(
            published_week,
            section,
            None,  # applies to whole batch, guaranteed to match pilot_student's group
            pilot_faculty,
            [
                (candidate_days[0], "09:00", "10:00", "Room 201"),
                (candidate_days[1], "11:00", "12:00", "Room 202"),
            ],
        )
        if published_week.status != "published":
            published_week.status = "published"
            published_week.save(update_fields=["status"])

        self.stdout.write(self.style.SUCCESS("\n✅ Timetable demo data seeded successfully!"))
        self.stdout.write(f"  - Batch: {batch}")
        self.stdout.write(f"  - Academic Period: {academic_period} ({period_start} - {period_end})")
        self.stdout.write(f"  - Section: {section}")
        self.stdout.write(f"  - Draft week (entries CRUD): {entries_week.week_start_date}")
        self.stdout.write(f"  - Draft week (publish-ready cells): {publish_week.week_start_date}")
        self.stdout.write(f"  - Published week (current): {published_week.week_start_date}")

    def _get_or_create_user(self, *, username, email, first_name, last_name, group):
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password="password123",
                first_name=first_name,
                last_name=last_name,
            )
            self.stdout.write(f"  ✓ Created {username} user")
        user.groups.add(group)
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
        return user

    def _get_or_create_weekly_timetable(self, academic_period, batch, week_start_date, status, created_by):
        timetable, created = WeeklyTimetable.objects.get_or_create(
            academic_period=academic_period,
            batch=batch,
            week_start_date=week_start_date,
            defaults={"status": status, "created_by": created_by},
        )
        if created:
            self.stdout.write(f"  ✓ Created weekly timetable for {week_start_date} ({status})")
        return timetable

    def _ensure_entries(self, weekly_timetable, section, group, created_by, specs):
        """specs: list of (day_of_week, start_time, end_time, room)"""
        from datetime import time as time_cls

        for day_of_week, start, end, room in specs:
            start_h, start_m = (int(x) for x in start.split(":"))
            end_h, end_m = (int(x) for x in end.split(":"))
            exists = TimetableEntry.objects.filter(
                weekly_timetable=weekly_timetable,
                section=section,
                day_of_week=day_of_week,
                start_time=time_cls(start_h, start_m),
            ).exists()
            if exists:
                continue
            entry = TimetableEntry(
                weekly_timetable=weekly_timetable,
                section=section,
                group=group,
                day_of_week=day_of_week,
                start_time=time_cls(start_h, start_m),
                end_time=time_cls(end_h, end_m),
                room=room,
                created_by=created_by,
            )
            entry.save()
            self.stdout.write(f"  ✓ Created timetable entry: day={day_of_week} {start}-{end} room={room}")

    def _ensure_publishable_entries(self, weekly_timetable, section, group, created_by):
        """Create exactly 3 TimetableEntry rows per day (18 total),
        satisfying WeeklyTimetableViewSet.publish's 'exactly 3 scheduled
        periods per day' validation — without needing to add 18 entries
        through the UI."""
        publish_slots = DEFAULT_TIME_SLOTS[:3]
        specs = [
            (day, slot.split("-")[0], slot.split("-")[1], "Room 101")
            for day in range(6)
            for slot in publish_slots
        ]
        self._ensure_entries(weekly_timetable, section, group, created_by, specs)
