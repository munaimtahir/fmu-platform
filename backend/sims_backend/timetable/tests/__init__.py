"""
Tests for Timetable API (publish with exactly 3 periods validation)
"""

from datetime import date, time, timedelta

import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Program, Section
from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = User.objects.create_user(username="admin", email="admin@test.com", password="testpass123")
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


@pytest.fixture
def api_client(admin_user):
    """Create API client with admin authentication"""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def academic_structure(db, admin_user):
    """Create academic structure for tests"""
    program = Program.objects.create(name="MBBS", description="Bachelor of Medicine")
    batch = Batch.objects.create(name="2024 Batch", program=program, start_year=2024)
    period = AcademicPeriod.objects.create(
        name="Fall 2024", start_date=date.today(), end_date=date.today() + timedelta(days=90)
    )
    department = Department.objects.create(name="MBBS Department")
    course = Course.objects.create(code="MBBS-101", name="MBBS Course", department=department, academic_period=period)
    section = Section.objects.create(course=course, academic_period=period, name="Section A", faculty=admin_user)

    # Create a weekly timetable
    monday = date.today() - timedelta(days=date.today().weekday())  # Get this week's Monday
    timetable = WeeklyTimetable.objects.create(
        academic_period=period, batch=batch, week_start_date=monday, status="draft", created_by=admin_user
    )

    return {"program": program, "batch": batch, "period": period, "timetable": timetable, "section": section}


@pytest.mark.django_db
class TestTimetablePublish:
    """Tests for timetable publish with exactly 3 periods constraint"""

    def test_publish_with_exactly_3_periods_per_day(self, api_client, academic_structure):
        """Timetable with exactly 3 periods per day can be published"""
        timetable = academic_structure["timetable"]
        section = academic_structure["section"]

        # Create exactly 3 periods for each day (Monday-Saturday)
        for day in range(6):
            for i in range(3):
                TimetableEntry.objects.create(
                    weekly_timetable=timetable,
                    section=section,
                    day_of_week=day,
                    start_time=time(8 + i, 0),
                    end_time=time(9 + i, 0),
                    room=f"Room {100 + i}",
                    created_by=academic_structure["timetable"].created_by,
                )

        response = api_client.post(f"/api/timetable/weekly-timetables/{timetable.id}/publish/")
        assert response.status_code == status.HTTP_200_OK

        timetable.refresh_from_db()
        assert timetable.status == "published"

    def test_publish_fails_with_less_than_3_periods(self, api_client, academic_structure):
        """Timetable with less than 3 periods per day cannot be published"""
        timetable = academic_structure["timetable"]
        section = academic_structure["section"]

        # Create only 2 periods for Monday, 3 for others
        for day in range(6):
            periods_count = 2 if day == 0 else 3
            for i in range(periods_count):
                TimetableEntry.objects.create(
                    weekly_timetable=timetable,
                    section=section,
                    day_of_week=day,
                    start_time=time(8 + i, 0),
                    end_time=time(9 + i, 0),
                    room=f"Room {100 + i}",
                    created_by=academic_structure["timetable"].created_by,
                )

        response = api_client.post(f"/api/timetable/weekly-timetables/{timetable.id}/publish/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "INVALID_PERIOD_COUNT" in response.data.get("error", {}).get("code", "")
        assert "Monday (2 periods)" in str(response.data)

    def test_publish_fails_with_more_than_3_periods(self, api_client, academic_structure):
        """Timetable with more than 3 periods per day cannot be published"""
        timetable = academic_structure["timetable"]
        section = academic_structure["section"]

        # Create 4 periods for Monday, 3 for others
        for day in range(6):
            periods_count = 4 if day == 0 else 3
            for i in range(periods_count):
                TimetableEntry.objects.create(
                    weekly_timetable=timetable,
                    section=section,
                    day_of_week=day,
                    start_time=time(8 + i, 0),
                    end_time=time(9 + i, 0),
                    room=f"Room {100 + i}",
                    created_by=academic_structure["timetable"].created_by,
                )

        response = api_client.post(f"/api/timetable/weekly-timetables/{timetable.id}/publish/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "INVALID_PERIOD_COUNT" in response.data.get("error", {}).get("code", "")
        assert "Monday (4 periods)" in str(response.data)

    def test_publish_already_published_timetable(self, api_client, academic_structure):
        """Publishing an already published timetable returns error"""
        timetable = academic_structure["timetable"]
        timetable.status = "published"
        timetable.save()

        response = api_client.post(f"/api/timetable/weekly-timetables/{timetable.id}/publish/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already published" in response.data["detail"].lower()

    def test_cancelled_entry_not_counted_as_period(self, api_client, academic_structure):
        """Entries with CANCELLED status are not counted as periods"""
        timetable = academic_structure["timetable"]
        section = academic_structure["section"]

        # Create 3 scheduled periods + 1 cancelled entry per day
        for day in range(6):
            for i in range(4):
                entry = TimetableEntry.objects.create(
                    weekly_timetable=timetable,
                    section=section,
                    day_of_week=day,
                    start_time=time(8 + i, 0),
                    end_time=time(9 + i, 0),
                    room=f"Room {100 + i}",
                    created_by=academic_structure["timetable"].created_by,
                )
                if i == 3:  # 4th entry per day is cancelled, shouldn't count
                    entry.status = TimetableEntry.STATUS_CANCELLED
                    entry.save()

        response = api_client.post(f"/api/timetable/weekly-timetables/{timetable.id}/publish/")
        assert response.status_code == status.HTTP_200_OK

        timetable.refresh_from_db()
        assert timetable.status == "published"
