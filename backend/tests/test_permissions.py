"""
Tests for role-based permission enforcement on Attendance, Results, and Finance endpoints.

These tests ensure students can only see their own data and admins can see all data.
"""

import pytest
from datetime import datetime, timezone as dt_timezone
from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import (
    AcademicPeriod,
    Batch,
    Department,
    Group as StudentGroup,
    Program,
)
from sims_backend.attendance.models import Attendance
from sims_backend.exams.models import Exam
from sims_backend.finance.models import Charge, StudentLedgerItem
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


@pytest.fixture
def setup_academic_structure(db):
    """Create basic academic structure needed for tests"""
    department = Department.objects.create(name="Medicine", code="MED")
    program = Program.objects.create(
        name="MBBS",
        description="Bachelor of Medicine and Bachelor of Surgery",
    )
    batch = Batch.objects.create(name="Batch 2024", program=program, start_year=2024)
    group = StudentGroup.objects.create(name="Group A", batch=batch)
    
    # Create an academic period for sessions and exams
    academic_period = AcademicPeriod.objects.create(
        name="Year 1",
        period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
    )
    
    return {
        "department": department,
        "program": program,
        "batch": batch,
        "group": group,
        "academic_period": academic_period,
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
    """Create first student linked to user"""
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
    """Create second student linked to user"""
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


@pytest.mark.django_db
class TestAttendancePermissions:
    """Test attendance endpoint permission enforcement"""

    def test_student_sees_only_own_attendance(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure, faculty_user
    ):
        """Student should only see their own attendance records"""
        # Create a session
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,
            starts_at=datetime.now(dt_timezone.utc),
            ends_at=datetime.now(dt_timezone.utc),
        )

        # Create attendance for both students
        att1 = Attendance.objects.create(
            session=session, student=student1, status=Attendance.STATUS_PRESENT
        )
        att2 = Attendance.objects.create(
            session=session, student=student2, status=Attendance.STATUS_ABSENT
        )

        # Student 1 logs in and queries attendance
        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should only see their own attendance
        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 1
        assert results[0]["student"] == student1.id

    def test_student_without_student_record_sees_nothing(
        self, api_client, setup_academic_structure, faculty_user
    ):
        """Student user without linked Student record should see empty list"""
        # Create a user in STUDENT group but not linked to Student
        orphan_user = User.objects.create_user(username="orphan", password="pass123")
        orphan_user.groups.add(Group.objects.get(name="STUDENT"))

        api_client.force_authenticate(user=orphan_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 0

    def test_admin_sees_all_attendance(
        self, api_client, admin_user, student1, student2, setup_academic_structure, faculty_user
    ):
        """Admin should see all attendance records"""
        session = Session.objects.create(
            academic_period=setup_academic_structure["academic_period"],
            group=setup_academic_structure["group"],
            department=setup_academic_structure["department"],
            faculty=faculty_user,
            starts_at=datetime.now(dt_timezone.utc),
            ends_at=datetime.now(dt_timezone.utc),
        )

        Attendance.objects.create(
            session=session, student=student1, status=Attendance.STATUS_PRESENT
        )
        Attendance.objects.create(
            session=session, student=student2, status=Attendance.STATUS_ABSENT
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/attendance/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 2


@pytest.mark.django_db
class TestResultsPermissions:
    """Test results endpoint permission enforcement"""

    def test_student_sees_only_own_published_results(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure
    ):
        """Student should only see their own published results"""
        # Create an exam
        exam = Exam.objects.create(
            title="Midterm Exam",
            academic_period=setup_academic_structure["academic_period"],
            department=setup_academic_structure["department"],
        )

        # Create results for both students - both published
        result1 = ResultHeader.objects.create(
            exam=exam,
            student=student1,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=80,
            total_max=100,
        )
        result2 = ResultHeader.objects.create(
            exam=exam,
            student=student2,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=75,
            total_max=100,
        )

        # Student 1 logs in and queries results
        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/results/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        # Should only see their own result
        assert len(results) == 1
        assert results[0]["student"] == student1.id

    def test_student_cannot_see_draft_results(
        self, api_client, student1_user, student1, setup_academic_structure
    ):
        """Student should not see draft results"""
        exam = Exam.objects.create(
            title="Final Exam",
            academic_period=setup_academic_structure["academic_period"],
            department=setup_academic_structure["department"],
        )

        # Create a draft result
        ResultHeader.objects.create(
            exam=exam,
            student=student1,
            status=ResultHeader.STATUS_DRAFT,
            total_obtained=85,
            total_max=100,
        )

        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/results/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 0

    def test_admin_sees_all_results(
        self, api_client, admin_user, student1, student2, setup_academic_structure
    ):
        """Admin should see all results regardless of status"""
        exam = Exam.objects.create(
            title="Midterm",
            academic_period=setup_academic_structure["academic_period"],
            department=setup_academic_structure["department"],
        )

        ResultHeader.objects.create(
            exam=exam,
            student=student1,
            status=ResultHeader.STATUS_DRAFT,
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

        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/results/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 2


@pytest.mark.django_db
class TestFinancePermissions:
    """Test finance endpoint permission enforcement"""

    def test_student_sees_only_own_ledger(
        self, api_client, student1_user, student2_user, student1, student2, setup_academic_structure
    ):
        """Student should only see their own ledger items"""
        # Create a charge
        charge = Charge.objects.create(
            title="Tuition Fee",
            amount=50000,
            due_date="2024-01-01",
        )

        # Create ledger items for both students
        ledger1 = StudentLedgerItem.objects.create(
            student=student1,
            charge=charge,
            status=StudentLedgerItem.STATUS_PENDING,
        )
        ledger2 = StudentLedgerItem.objects.create(
            student=student2,
            charge=charge,
            status=StudentLedgerItem.STATUS_PAID,
        )

        # Student 1 logs in and queries ledger
        api_client.force_authenticate(user=student1_user)
        response = api_client.get("/api/ledger/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        # Should only see their own ledger
        assert len(results) == 1
        assert results[0]["student"] == student1.id

    def test_student_without_student_record_sees_no_ledger(self, api_client):
        """Student user without linked Student record should see empty ledger"""
        orphan_user = User.objects.create_user(username="orphan2", password="pass123")
        orphan_user.groups.add(Group.objects.get(name="STUDENT"))

        api_client.force_authenticate(user=orphan_user)
        response = api_client.get("/api/ledger/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 0

    def test_admin_sees_all_ledger_items(
        self, api_client, admin_user, student1, student2, setup_academic_structure
    ):
        """Admin/Finance should see all ledger items"""
        charge = Charge.objects.create(
            title="Library Fee",
            amount=5000,
            due_date="2024-01-01",
        )

        StudentLedgerItem.objects.create(
            student=student1, charge=charge, status=StudentLedgerItem.STATUS_PENDING
        )
        StudentLedgerItem.objects.create(
            student=student2, charge=charge, status=StudentLedgerItem.STATUS_PAID
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/ledger/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data

        assert len(results) == 2



