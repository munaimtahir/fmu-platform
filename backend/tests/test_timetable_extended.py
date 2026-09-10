from datetime import date, time

import pytest
from django.contrib.auth.models import Group, User

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Program, Section
from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable


@pytest.fixture
def timetable_setup(db):
    admin_user = User.objects.create_superuser(username="admin_tt", password="pass")
    faculty_user = User.objects.create_user(username="fac_tt", password="pass")
    fac_group, _ = Group.objects.get_or_create(name="FACULTY")
    faculty_user.groups.add(fac_group)

    student_user = User.objects.create_user(username="stu_tt", password="pass")
    stu_group, _ = Group.objects.get_or_create(name="STUDENT")
    student_user.groups.add(stu_group)

    program = Program.objects.create(name="TT Program")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    period = AcademicPeriod.objects.create(
        name="TT Period",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 3, 31),
        period_type="YEAR"
    )

    timetable = WeeklyTimetable.objects.create(
        batch=batch, academic_period=period,
        week_start_date=date(2024, 1, 1),
        created_by=faculty_user, status="draft"
    )

    department = Department.objects.create(name="TT Department")
    course = Course.objects.create(code="TT-101", name="TT Course", department=department, academic_period=period)
    section = Section.objects.create(course=course, academic_period=period, name="Section A", faculty=faculty_user)

    return {
        "admin": admin_user,
        "faculty": faculty_user,
        "student": student_user,
        "program": program,
        "batch": batch,
        "period": period,
        "timetable": timetable,
        "section": section,
    }

@pytest.mark.django_db
class TestWeeklyTimetableActions:
    def test_publish_validation_fails_without_3_periods(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        section = timetable_setup["section"]
        api_client.force_authenticate(user=timetable_setup["faculty"])

        # Create only 1 entry for Monday
        TimetableEntry.objects.create(
            weekly_timetable=tt, section=section, day_of_week=0,
            start_time=time(8, 0), end_time=time(9, 0),
            created_by=timetable_setup["faculty"],
        )

        url = f"/api/timetable/weekly-timetables/{tt.id}/publish/"
        response = api_client.post(url)
        assert response.status_code == 400
        assert response.data["error"]["code"] == "INVALID_PERIOD_COUNT"

    def test_publish_success_with_3_periods(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        section = timetable_setup["section"]
        api_client.force_authenticate(user=timetable_setup["faculty"])

        # Create 3 TimetableEntry rows for EVERY day (0-5)
        slot_times = [(time(8, 0), time(9, 0)), (time(9, 0), time(10, 0)), (time(10, 0), time(11, 0))]
        for day in range(6):
            for start_time, end_time in slot_times:
                TimetableEntry.objects.create(
                    weekly_timetable=tt, section=section, day_of_week=day,
                    start_time=start_time, end_time=end_time,
                    created_by=timetable_setup["faculty"],
                )

        url = f"/api/timetable/weekly-timetables/{tt.id}/publish/"
        response = api_client.post(url)
        assert response.status_code == 200
        tt.refresh_from_db()
        assert tt.status == "published"

    def test_publish_ignores_cancelled_entries(self, api_client, timetable_setup):
        """A CANCELLED entry shouldn't count toward the 'exactly 3' total."""
        tt = timetable_setup["timetable"]
        section = timetable_setup["section"]
        api_client.force_authenticate(user=timetable_setup["faculty"])

        slot_times = [(time(8, 0), time(9, 0)), (time(9, 0), time(10, 0)), (time(10, 0), time(11, 0))]
        for day in range(6):
            for start_time, end_time in slot_times:
                TimetableEntry.objects.create(
                    weekly_timetable=tt, section=section, day_of_week=day,
                    start_time=start_time, end_time=end_time,
                    created_by=timetable_setup["faculty"],
                )
        # Cancel one of Monday's entries - Monday should now be short one period.
        cancelled = TimetableEntry.objects.filter(weekly_timetable=tt, day_of_week=0).first()
        cancelled.status = TimetableEntry.STATUS_CANCELLED
        cancelled.save()

        url = f"/api/timetable/weekly-timetables/{tt.id}/publish/"
        response = api_client.post(url)
        assert response.status_code == 400
        assert response.data["error"]["code"] == "INVALID_PERIOD_COUNT"
        assert "Monday" in str(response.data["error"]["days_with_wrong_count"])

    def test_unpublish_admin_only(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        tt.status = "published"
        tt.save()

        # Faculty cannot unpublish
        api_client.force_authenticate(user=timetable_setup["faculty"])
        url = f"/api/timetable/weekly-timetables/{tt.id}/unpublish/"
        response = api_client.post(url)
        assert response.status_code == 403

        # Admin can
        api_client.force_authenticate(user=timetable_setup["admin"])
        response = api_client.post(url)
        assert response.status_code == 200
        tt.refresh_from_db()
        assert tt.status == "draft"

    def test_generate_templates(self, api_client, timetable_setup):
        api_client.force_authenticate(user=timetable_setup["admin"])
        url = "/api/timetable/weekly-timetables/generate_weekly_templates/"
        data = {
            "batch": timetable_setup["batch"].id,
            "academic_period": timetable_setup["period"].id
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        # Period is Jan to March (~13 weeks)
        assert response.data["total_weeks"] >= 12
