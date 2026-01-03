"""
Regression tests for data integrity contracts.

Tests ensure:
- Attendance uniqueness is enforced
- Enrollment uniqueness is enforced
- Duplicate prevention works correctly
"""

import pytest
from django.contrib.auth.models import Group, User
from django.db import IntegrityError
from rest_framework import status

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Program, Section
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.attendance.models import Attendance
from sims_backend.enrollment.models import Enrollment
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


@pytest.fixture
def setup_academic_structure(db):
    """Create academic structure for tests"""
    department = Department.objects.create(name="Medicine", code="MED")
    program = Program.objects.create(name="MBBS", description="Bachelor of Medicine")
    batch = Batch.objects.create(name="Batch 2024", program=program, start_year=2024)
    group = StudentGroup.objects.create(name="Group A", batch=batch)
    period = AcademicPeriod.objects.create(
        name="Year 1",
        period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
    )
    course = Course.objects.create(
        name="Anatomy",
        code="ANAT101",
        department=department,
        credits=4,
    )
    section = Section.objects.create(
        course=course,
        academic_period=period,
        name="Section A",
        capacity=50,
    )
    return {
        "department": department,
        "program": program,
        "batch": batch,
        "group": group,
        "academic_period": period,
        "course": course,
        "section": section,
    }


@pytest.fixture
def student1_user(db):
    """Create first student user"""
    user = User.objects.create_user(
        username="student1", email="student1@test.com", password="pass123"
    )
    user.groups.add(Group.objects.get(name="STUDENT"))
    return user


@pytest.fixture
def student1(db, student1_user, setup_academic_structure):
    """Create first student"""
    return Student.objects.create(
        user=student1_user,
        reg_no="MBBS2401",
        name="Student One",
        program=setup_academic_structure["program"],
        batch=setup_academic_structure["batch"],
        group=setup_academic_structure["group"],
        email="student1@test.com",
    )


@pytest.fixture
def faculty_user(db):
    """Create faculty user"""
    user = User.objects.create_user(username="faculty1", password="pass123")
    user.groups.add(Group.objects.get(name="FACULTY"))
    return user


@pytest.mark.django_db
class TestAttendanceUniqueness:
    """Contract: One attendance record per student per session"""

    def test_attendance_duplicate_blocked_at_db_level(
        self, setup_academic_structure, student1, faculty_user
    ):
        """Database constraint should prevent duplicate attendance"""
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,
            starts_at="2024-01-15T10:00:00Z",
            ends_at="2024-01-15T11:00:00Z",
        )

        # Create first attendance
        Attendance.objects.create(
            session=session,
            student=student1,
            status=Attendance.STATUS_PRESENT,
        )

        # Attempt duplicate - should raise IntegrityError
        with pytest.raises(IntegrityError):
            Attendance.objects.create(
                session=session,
                student=student1,
                status=Attendance.STATUS_ABSENT,
            )

    def test_attendance_duplicate_blocked_via_api(
        self, api_client, setup_academic_structure, student1, faculty_user
    ):
        """API should handle duplicate attendance gracefully"""
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,
            starts_at="2024-01-15T10:00:00Z",
            ends_at="2024-01-15T11:00:00Z",
        )

        api_client.force_authenticate(user=faculty_user)

        # Create first attendance
        response1 = api_client.post(
            f"/api/attendance/sessions/{session.id}/mark/",
            {"student_id": student1.id, "status": Attendance.STATUS_PRESENT},
        )
        assert response1.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

        # Attempt duplicate - should update, not create duplicate
        response2 = api_client.post(
            f"/api/attendance/sessions/{session.id}/mark/",
            {"student_id": student1.id, "status": Attendance.STATUS_ABSENT},
        )
        assert response2.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

        # Verify only one attendance record exists
        count = Attendance.objects.filter(session=session, student=student1).count()
        assert count == 1, "Must have exactly one attendance record per student per session"


@pytest.mark.django_db
class TestEnrollmentUniqueness:
    """Contract: One enrollment per student per section"""

    def test_enrollment_duplicate_blocked_at_db_level(
        self, setup_academic_structure, student1
    ):
        """Database constraint should prevent duplicate enrollment"""
        section = setup_academic_structure["section"]

        # Create first enrollment
        Enrollment.objects.create(
            student=student1,
            section=section,
            status=Enrollment.STATUS_ENROLLED,
        )

        # Attempt duplicate - should raise IntegrityError
        with pytest.raises(IntegrityError):
            Enrollment.objects.create(
                student=student1,
                section=section,
                status=Enrollment.STATUS_ENROLLED,
            )

    def test_enrollment_duplicate_blocked_via_api(
        self, api_client, admin_user, setup_academic_structure, student1
    ):
        """API should return 409 Conflict for duplicate enrollment"""
        section = setup_academic_structure["section"]

        api_client.force_authenticate(user=admin_user)

        # Create first enrollment
        response1 = api_client.post(
            "/api/enrollment/",
            {
                "student": student1.id,
                "section": section.id,
                "status": Enrollment.STATUS_ENROLLED,
            },
        )
        assert response1.status_code == status.HTTP_201_CREATED

        # Attempt duplicate - should return 409 Conflict
        response2 = api_client.post(
            "/api/enrollment/",
            {
                "student": student1.id,
                "section": section.id,
                "status": Enrollment.STATUS_ENROLLED,
            },
        )
        assert response2.status_code == status.HTTP_409_CONFLICT, (
            "API must return 409 Conflict for duplicate enrollment"
        )
