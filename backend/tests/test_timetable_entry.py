"""Tests for the normalized TimetableEntry model/API and its RBAC.

Covers: model validation (end_time > start_time, collisions), the RBAC
migration off `in_group` onto `PermissionTaskRequired` for the whole
timetable app (Session/WeeklyTimetable/TimetableCell/TimetableEntry), and
the `cancel` action.
"""

from datetime import date, time, timedelta

import pytest
from django.contrib.auth.models import Group, User
from django.core.exceptions import ValidationError

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group as AcademicGroup, Program, Section
from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable


@pytest.fixture
def entry_setup(db):
    admin_user = User.objects.create_superuser(username="admin_te", password="pass")

    faculty_user = User.objects.create_user(username="fac_te", password="pass")
    fac_group, _ = Group.objects.get_or_create(name="FACULTY")
    faculty_user.groups.add(fac_group)

    other_faculty_user = User.objects.create_user(username="fac_te_other", password="pass")
    other_faculty_user.groups.add(fac_group)

    coordinator_user = User.objects.create_user(username="coord_te", password="pass")
    coord_group, _ = Group.objects.get_or_create(name="COORDINATOR")
    coordinator_user.groups.add(coord_group)

    student_user = User.objects.create_user(username="stu_te", password="pass")
    stu_group, _ = Group.objects.get_or_create(name="STUDENT")
    student_user.groups.add(stu_group)

    program = Program.objects.create(name="TE Program")
    batch = Batch.objects.create(program=program, name="TE Batch", start_year=2026)
    group = AcademicGroup.objects.create(batch=batch, name="TE Group")
    period = AcademicPeriod.objects.create(name="TE Period", period_type="YEAR")
    department = Department.objects.create(name="TE Department")
    course = Course.objects.create(code="TE-101", name="TE Course", department=department)
    section = Section.objects.create(
        course=course, name="TE Section", academic_period=period, faculty=faculty_user, group=group
    )

    monday = date.today() - timedelta(days=date.today().weekday())
    weekly_timetable = WeeklyTimetable.objects.create(
        batch=batch, academic_period=period, week_start_date=monday, created_by=faculty_user, status="draft"
    )

    return {
        "admin": admin_user,
        "faculty": faculty_user,
        "other_faculty": other_faculty_user,
        "coordinator": coordinator_user,
        "student": student_user,
        "batch": batch,
        "group": group,
        "period": period,
        "section": section,
        "weekly_timetable": weekly_timetable,
    }


@pytest.mark.django_db
class TestTimetableEntryModelValidation:
    def test_end_time_must_be_after_start_time(self, entry_setup):
        entry = TimetableEntry(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(10, 0),
            end_time=time(9, 0),
            created_by=entry_setup["faculty"],
        )
        with pytest.raises(ValidationError):
            entry.save()

    def test_faculty_double_booking_rejected(self, entry_setup):
        TimetableEntry.objects.create(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=entry_setup["faculty"],
        )
        clashing = TimetableEntry(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],  # same faculty via same section
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 30),
            end_time=time(10, 30),
            created_by=entry_setup["faculty"],
        )
        with pytest.raises(ValidationError):
            clashing.save()

    def test_non_overlapping_entries_allowed(self, entry_setup):
        TimetableEntry.objects.create(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=entry_setup["faculty"],
        )
        # Should not raise.
        TimetableEntry.objects.create(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(10, 0),
            end_time=time(11, 0),
            created_by=entry_setup["faculty"],
        )

    def test_cancelled_entries_do_not_count_as_collisions(self, entry_setup):
        TimetableEntry.objects.create(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            status=TimetableEntry.STATUS_CANCELLED,
            created_by=entry_setup["faculty"],
        )
        # Should not raise even though it overlaps the cancelled entry.
        TimetableEntry.objects.create(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=entry_setup["faculty"],
        )


@pytest.mark.django_db
class TestTimetableEntryRBAC:
    def _create_entry(self, entry_setup, **overrides):
        defaults = dict(
            weekly_timetable=entry_setup["weekly_timetable"],
            section=entry_setup["section"],
            group=entry_setup["group"],
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=entry_setup["faculty"],
        )
        defaults.update(overrides)
        return TimetableEntry.objects.create(**defaults)

    def test_student_cannot_create_entry(self, api_client, entry_setup):
        api_client.force_authenticate(user=entry_setup["student"])
        response = api_client.post(
            "/api/timetable/entries/",
            {
                "weekly_timetable": entry_setup["weekly_timetable"].id,
                "section": entry_setup["section"].id,
                "group": entry_setup["group"].id,
                "day_of_week": 0,
                "start_time": "09:00",
                "end_time": "10:00",
            },
        )
        assert response.status_code == 403

    def test_student_cannot_see_draft_entries(self, api_client, entry_setup):
        self._create_entry(entry_setup)
        api_client.force_authenticate(user=entry_setup["student"])
        response = api_client.get("/api/timetable/entries/")
        assert response.status_code == 200
        assert response.data["results"] == [] if "results" in response.data else response.data == []

    def test_coordinator_can_create_entry(self, api_client, entry_setup):
        api_client.force_authenticate(user=entry_setup["coordinator"])
        response = api_client.post(
            "/api/timetable/entries/",
            {
                "weekly_timetable": entry_setup["weekly_timetable"].id,
                "section": entry_setup["section"].id,
                "group": entry_setup["group"].id,
                "day_of_week": 0,
                "start_time": "09:00",
                "end_time": "10:00",
            },
        )
        assert response.status_code == 201

    def test_faculty_cannot_modify_another_faculty_members_draft_timetable(self, api_client, entry_setup):
        """The entry falls outside the other faculty member's queryset (they
        don't own the timetable and don't teach this section), so DRF
        reports 404 rather than 403 - correct, and avoids leaking existence
        of entries the requester has no relationship to."""
        entry = self._create_entry(entry_setup)
        api_client.force_authenticate(user=entry_setup["other_faculty"])
        response = api_client.patch(f"/api/timetable/entries/{entry.id}/", {"room": "New Room"})
        assert response.status_code == 404

    def test_cancel_action_marks_status_without_deleting(self, api_client, entry_setup):
        entry = self._create_entry(entry_setup)
        api_client.force_authenticate(user=entry_setup["faculty"])
        response = api_client.post(f"/api/timetable/entries/{entry.id}/cancel/")
        assert response.status_code == 200
        entry.refresh_from_db()
        assert entry.status == TimetableEntry.STATUS_CANCELLED

    def test_cannot_create_entry_on_published_timetable(self, api_client, entry_setup):
        entry_setup["weekly_timetable"].status = "published"
        entry_setup["weekly_timetable"].save()
        api_client.force_authenticate(user=entry_setup["coordinator"])
        response = api_client.post(
            "/api/timetable/entries/",
            {
                "weekly_timetable": entry_setup["weekly_timetable"].id,
                "section": entry_setup["section"].id,
                "group": entry_setup["group"].id,
                "day_of_week": 0,
                "start_time": "09:00",
                "end_time": "10:00",
            },
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestLegacyTimetableViewsetsNowEnforceRBAC:
    """Regression guard: SessionViewSet/WeeklyTimetableViewSet/TimetableCellViewSet
    previously had a no-op get_permissions() (both branches returned
    IsAuthenticated()), so ANY authenticated user - including students -
    could create/update/destroy. This confirms that gap is closed."""

    def test_student_cannot_create_weekly_timetable(self, api_client, entry_setup):
        api_client.force_authenticate(user=entry_setup["student"])
        response = api_client.post(
            "/api/timetable/weekly-timetables/",
            {
                "academic_period": entry_setup["period"].id,
                "batch": entry_setup["batch"].id,
                "week_start_date": (date.today() + timedelta(days=14)).isoformat(),
            },
        )
        assert response.status_code == 403

    def test_student_cannot_create_session(self, api_client, entry_setup):
        api_client.force_authenticate(user=entry_setup["student"])
        response = api_client.post(
            "/api/timetable/sessions/",
            {
                "academic_period": entry_setup["period"].id,
                "group": entry_setup["group"].id,
                "faculty": entry_setup["faculty"].id,
                "department": entry_setup["section"].course.department.id,
                "starts_at": "2026-01-01T09:00:00Z",
                "ends_at": "2026-01-01T10:00:00Z",
            },
        )
        assert response.status_code == 403

    def test_faculty_can_still_create_own_session(self, api_client, entry_setup):
        """Faculty retain their existing ability to manage sessions/timetables."""
        api_client.force_authenticate(user=entry_setup["faculty"])
        response = api_client.post(
            "/api/timetable/sessions/",
            {
                "academic_period": entry_setup["period"].id,
                "group": entry_setup["group"].id,
                "faculty": entry_setup["faculty"].id,
                "department": entry_setup["section"].course.department.id,
                "starts_at": "2026-01-01T09:00:00Z",
                "ends_at": "2026-01-01T10:00:00Z",
            },
        )
        assert response.status_code == 201
