import pytest
from django.contrib.auth.models import Group
from rest_framework import status

from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch, Group as StudentGroup
from sims_backend.attendance.models import Attendance
from sims_backend.finance.models import StudentLedgerItem, Charge, ChargeTemplate
from sims_backend.results.models import ResultHeader
from sims_backend.timetable.models import Session
from sims_backend.exams.models import Exam

@pytest.mark.django_db
def test_dashboard_stats_student_linked(api_client, student_user):
    # Ensure STUDENT group exists and user is in it
    student_group, _ = Group.objects.get_or_create(name="STUDENT")
    student_user.groups.add(student_group)

    # Authenticate
    api_client.force_authenticate(user=student_user)

    # 1. Test unlinked state (should return error/warning)
    response = api_client.get("/api/dashboard/stats/")
    assert response.status_code == status.HTTP_200_OK
    assert "No student record linked" in response.data.get("message", "")

    # 2. Setup Student and related data
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = StudentGroup.objects.create(batch=batch, name="A")

    student = Student.objects.create(
        user=student_user,
        reg_no="REG-123",
        name="Test Student",
        program=program,
        batch=batch,
        group=group
    )

    # Create Attendance
    # Need a session
    from sims_backend.academics.models import AcademicPeriod, Department

    period = AcademicPeriod.objects.create(period_type="YEAR", name="Year 1")
    dept = Department.objects.create(name="Anatomy", code="ANAT")

    session1 = Session.objects.create(
        academic_period=period,
        group=group,
        faculty=student_user, # Just for FK requirement
        department=dept,
        starts_at="2024-01-01 09:00:00+00:00",
        ends_at="2024-01-01 10:00:00+00:00"
    )

    Attendance.objects.create(
        session=session1,
        student=student,
        status=Attendance.STATUS_PRESENT
    )

    # Create Ledger Item
    charge = Charge.objects.create(
        title="Tuition",
        amount=1000,
        due_date="2024-01-01"
    )

    StudentLedgerItem.objects.create(
        student=student,
        charge=charge,
        status=StudentLedgerItem.STATUS_PENDING
    )

    # Create Result
    exam = Exam.objects.create(
        academic_period=period,
        title="Midterm",
        published=True
    )

    ResultHeader.objects.create(
        exam=exam,
        student=student,
        status=ResultHeader.STATUS_PUBLISHED
    )

    # 3. Test linked state
    response = api_client.get("/api/dashboard/stats/")
    assert response.status_code == status.HTTP_200_OK

    data = response.data
    # Assertions based on what we plan to implement
    # Ideally these keys will be present
    # For now, it will fail or return the old structure if I haven't implemented it yet.
    # This test serves as TDD.

    assert data["student_name"] == "Test Student"
    assert data["program"] == "MBBS"
    assert data["classes_attended"] == 1
    assert data["pending_dues"] == 1
    assert data["published_results"] == 1
