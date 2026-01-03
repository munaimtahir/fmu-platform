"""
Regression tests for authentication and authorization contracts.

Tests ensure:
- Students can only see their own data
- Faculty can only access assigned sections
- Role-based endpoint access is enforced
"""

import pytest
from django.contrib.auth.models import Group, User
from rest_framework import status

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.attendance.models import Attendance
from sims_backend.finance.models import LedgerEntry
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session
from sims_backend.exams.models import Exam


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
    return {
        "department": department,
        "program": program,
        "batch": batch,
        "group": group,
        "academic_period": period,
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
def student2_user(db):
    """Create second student user"""
    user = User.objects.create_user(
        username="student2", email="student2@test.com", password="pass123"
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
def student2(db, student2_user, setup_academic_structure):
    """Create second student"""
    return Student.objects.create(
        user=student2_user,
        reg_no="MBBS2402",
        name="Student Two",
        program=setup_academic_structure["program"],
        batch=setup_academic_structure["batch"],
        group=setup_academic_structure["group"],
        email="student2@test.com",
    )


@pytest.fixture
def faculty_user(db):
    """Create faculty user"""
    user = User.objects.create_user(username="faculty1", password="pass123")
    user.groups.add(Group.objects.get(name="FACULTY"))
    return user


@pytest.fixture
def faculty2_user(db):
    """Create second faculty user"""
    user = User.objects.create_user(username="faculty2", password="pass123")
    user.groups.add(Group.objects.get(name="FACULTY"))
    return user


@pytest.mark.django_db
class TestStudentIsolation:
    """Contract: Students can ONLY see their own data"""

    def test_student_sees_only_own_attendance(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure, faculty_user
    ):
        """Student should only see their own attendance records"""
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,
            starts_at="2024-01-15T10:00:00Z",
            ends_at="2024-01-15T11:00:00Z",
        )

        Attendance.objects.create(
            session=session, student=student1, status=Attendance.STATUS_PRESENT
        )
        Attendance.objects.create(
            session=session, student=student2, status=Attendance.STATUS_ABSENT
        )

        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data

        assert len(results) == 1, "Student must only see their own attendance"
        assert results[0]["student"] == student1.id, "Attendance must be for student1"

    def test_student_sees_only_own_results(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure
    ):
        """Student should only see their own published results"""
        exam = Exam.objects.create(
            title="Midterm Exam",
            academic_period=setup_academic_structure["academic_period"],
            department=setup_academic_structure["department"],
        )

        ResultHeader.objects.create(
            exam=exam,
            student=student1,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=80,
            total_max=100,
        )
        ResultHeader.objects.create(
            exam=exam,
            student=student2,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=75,
            total_max=100,
        )

        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/results/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data

        assert len(results) == 1, "Student must only see their own results"
        assert results[0]["student"] == student1.id, "Result must be for student1"

    def test_student_sees_only_own_ledger(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure
    ):
        """Student should only see their own ledger entries"""
        LedgerEntry.objects.create(
            student=student1,
            term=setup_academic_structure["academic_period"],
            entry_type=LedgerEntry.ENTRY_DEBIT,
            amount=1000,
            reference_type=LedgerEntry.REF_VOUCHER,
            reference_id="v1",
        )
        LedgerEntry.objects.create(
            student=student2,
            term=setup_academic_structure["academic_period"],
            entry_type=LedgerEntry.ENTRY_DEBIT,
            amount=2000,
            reference_type=LedgerEntry.REF_VOUCHER,
            reference_id="v2",
        )

        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/finance/ledger/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data

        assert len(results) == 1, "Student must only see their own ledger"
        assert results[0]["student"] == student1.id, "Ledger entry must be for student1"

    def test_student_cannot_access_other_student_finance(
        self, api_client, student1_user, student2, setup_academic_structure
    ):
        """Student cannot access another student's finance summary"""
        api_client.force_authenticate(user=student1_user)
        response = api_client.get(f"/api/finance/students/{student2.id}/")

        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ], "Student must not access other student's finance data"


@pytest.mark.django_db
class TestFacultyAccessControl:
    """Contract: Faculty can ONLY access assigned sections"""

    def test_faculty_cannot_access_unassigned_sections(
        self, api_client, faculty_user, faculty2_user, setup_academic_structure, student1
    ):
        """Faculty should not see attendance for sections they're not assigned to"""
        # Create session assigned to faculty2
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty2_user,  # Assigned to faculty2, not faculty_user
            starts_at="2024-01-15T10:00:00Z",
            ends_at="2024-01-15T11:00:00Z",
        )

        Attendance.objects.create(
            session=session, student=student1, status=Attendance.STATUS_PRESENT
        )

        # faculty_user tries to access attendance
        api_client.force_authenticate(user=faculty_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data

        # Should not see attendance for unassigned session
        assert len(results) == 0, "Faculty must not see attendance for unassigned sections"

    def test_faculty_can_access_assigned_sections(
        self, api_client, faculty_user, setup_academic_structure, student1
    ):
        """Faculty should see attendance for sections they're assigned to"""
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,  # Assigned to faculty_user
            starts_at="2024-01-15T10:00:00Z",
            ends_at="2024-01-15T11:00:00Z",
        )

        Attendance.objects.create(
            session=session, student=student1, status=Attendance.STATUS_PRESENT
        )

        api_client.force_authenticate(user=faculty_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get("results", data) if isinstance(data, dict) else data

        assert len(results) == 1, "Faculty must see attendance for assigned sections"
        assert results[0]["session"] == session.id


@pytest.mark.django_db
class TestRoleBasedAPIAccess:
    """Contract: Each role can ONLY access endpoints explicitly allowed"""

    def test_student_token_student_endpoints_only(self, api_client, student1_user):
        """Student token should only access student endpoints"""
        api_client.force_authenticate(user=student1_user)

        # Student endpoints - should work
        assert api_client.get("/api/auth/me/").status_code == status.HTTP_200_OK
        assert api_client.get("/api/attendance/").status_code == status.HTTP_200_OK
        assert api_client.get("/api/results/").status_code == status.HTTP_200_OK

        # Admin endpoints - should be blocked
        assert api_client.get("/api/admin/users/").status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_faculty_token_faculty_endpoints_only(self, api_client, faculty_user):
        """Faculty token should only access faculty endpoints"""
        api_client.force_authenticate(user=faculty_user)

        # Faculty endpoints - should work
        assert api_client.get("/api/auth/me/").status_code == status.HTTP_200_OK
        assert api_client.get("/api/sections/").status_code == status.HTTP_200_OK

        # Student finance endpoints - should be blocked
        assert api_client.get("/api/finance/vouchers/").status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_admin_token_all_endpoints(self, api_client, admin_user):
        """Admin token should access all endpoints"""
        api_client.force_authenticate(user=admin_user)

        # All endpoints should work for admin
        assert api_client.get("/api/auth/me/").status_code == status.HTTP_200_OK
        assert api_client.get("/api/students/").status_code == status.HTTP_200_OK
        assert api_client.get("/api/attendance/").status_code == status.HTTP_200_OK
