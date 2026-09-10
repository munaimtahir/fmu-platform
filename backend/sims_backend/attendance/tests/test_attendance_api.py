"""
Tests for Attendance API
"""

from datetime import date

import pytest
from django.contrib.auth.models import Group as AuthGroup
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group, Program
from sims_backend.attendance.models import Attendance
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


@pytest.fixture
def faculty_user(db):
    """Create a faculty user"""
    user = User.objects.create_user(username="faculty", password="test123")
    group, _ = AuthGroup.objects.get_or_create(name="FACULTY")
    user.groups.add(group)
    return user


@pytest.fixture
def api_client(faculty_user):
    """Create API client with faculty authentication"""
    client = APIClient()
    client.force_authenticate(user=faculty_user)
    return client


@pytest.fixture
def academic_setup(db, faculty_user):
    """Create academic structure for tests"""
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(name="2024", program=program, start_year=2024)
    group = Group.objects.create(name="Group A", batch=batch)
    department = Department.objects.create(name="Anatomy")
    period = AcademicPeriod.objects.create(name="Fall 2024", start_date=date.today())

    # Use Django's local date (not Python's date.today(), which follows the
    # OS timezone) so the session-date same-day edit rule enforced by
    # _validate_date() in the mark-attendance endpoint is satisfied.
    today_str = str(timezone.localdate())
    session = Session.objects.create(
        academic_period=period,
        group=group,
        faculty=faculty_user,
        department=department,
        starts_at=f"{today_str} 09:00:00",
        ends_at=f"{today_str} 10:00:00",
    )

    student = Student.objects.create(reg_no="2024-001", name="John Doe", program=program, batch=batch, group=group)

    return {"session": session, "student": student}


@pytest.mark.django_db
class TestAttendanceAPI:
    """Tests for attendance marking and retrieval"""

    def test_mark_session_attendance(self, api_client, academic_setup):
        """Faculty can mark attendance for their session"""
        session = academic_setup["session"]
        student = academic_setup["student"]

        data = {
            "date": str(session.starts_at)[:10],
            "attendance": [{"student_id": student.id, "status": "PRESENT"}],
        }

        response = api_client.post(f"/api/attendance/sessions/{session.id}/mark/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["created"] == 1

        # Verify in database
        attendance = Attendance.objects.get(session=session, student=student)
        assert attendance.status == "PRESENT"

    def test_update_existing_attendance(self, api_client, academic_setup):
        """Marking attendance again updates existing record"""
        session = academic_setup["session"]
        student = academic_setup["student"]

        # Create initial attendance
        Attendance.objects.create(
            session=session, student=student, status="PRESENT", marked_by=api_client.handler._force_user
        )

        # Update to ABSENT
        data = {
            "date": str(session.starts_at)[:10],
            "attendance": [{"student_id": student.id, "status": "ABSENT"}],
        }

        response = api_client.post(f"/api/attendance/sessions/{session.id}/mark/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated"] == 1

        # Verify update
        attendance = Attendance.objects.get(session=session, student=student)
        assert attendance.status == "ABSENT"

    def test_attendance_summary(self, api_client, academic_setup):
        """Summary endpoint returns correct statistics"""
        session = academic_setup["session"]
        student = academic_setup["student"]

        # Create attendance records across distinct sessions for the same
        # student, since Attendance enforces unique_together("session", "student")
        # and the summary endpoint aggregates across all of a student's sessions.
        for i in range(10):
            attendance_session = (
                session
                if i == 0
                else Session.objects.create(
                    academic_period=session.academic_period,
                    group=session.group,
                    faculty=session.faculty,
                    department=session.department,
                    starts_at=f"2024-01-{i + 1:02d} 09:00:00",
                    ends_at=f"2024-01-{i + 1:02d} 10:00:00",
                )
            )
            Attendance.objects.create(
                session=attendance_session,
                student=student,
                status="PRESENT" if i < 7 else "ABSENT",
                marked_by=api_client.handler._force_user,
            )

        response = api_client.get(f"/api/attendance/summary/?student={student.id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 10
        assert response.data["present"] == 7
        assert response.data["absent"] == 3
        assert response.data["percentage"] == 70.0
