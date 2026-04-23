from datetime import date

import pytest
from rest_framework import status

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group, Program, Section
from sims_backend.attendance.models import Attendance
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session


@pytest.fixture
def attendance_setup(db, faculty_user):
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(name="2024", program=program, start_year=2024)
    group = Group.objects.create(name="Group A", batch=batch)
    department = Department.objects.create(name="Anatomy")
    period = AcademicPeriod.objects.create(name="Fall 2024", start_date=date.today())
    course = Course.objects.create(name="Anatomy-1", code="ANA101", department=department, academic_period=period)
    section = Section.objects.create(name="Sec A", course=course, academic_period=period, group=group)

    # Base session
    session = Session.objects.create(
        academic_period=period,
        group=group,
        faculty=faculty_user,
        department=department,
        starts_at="2024-01-01 09:00:00",
        ends_at="2024-01-01 10:00:00",
    )

    student = Student.objects.create(reg_no="2024-001", name="John Doe", program=program, batch=batch, group=group)

    return {
        "session": session,
        "student": student,
        "section": section,
        "period": period,
        "group": group,
        "department": department,
    }


@pytest.mark.django_db
class TestAttendanceExtended:
    def test_attendance_eligibility(self, api_client, faculty_user, attendance_setup):
        """Test eligibility calculation via API with multiple sessions."""
        student = attendance_setup["student"]
        section = attendance_setup["section"]
        group = attendance_setup["group"]
        period = attendance_setup["period"]
        dept = attendance_setup["department"]

        # Create 10 sessions and 10 attendance records, 8 present (80%)
        for i in range(10):
            session = Session.objects.create(
                academic_period=period,
                group=group,
                faculty=faculty_user,
                department=dept,
                starts_at=f"2024-01-{i + 1:02d} 09:00:00",
                ends_at=f"2024-01-{i + 1:02d} 10:00:00",
            )
            Attendance.objects.create(
                session=session, student=student, status="PRESENT" if i < 8 else "ABSENT", marked_by=faculty_user
            )

        api_client.force_authenticate(user=faculty_user)
        response = api_client.get(f"/api/attendance/eligibility/?student_id={student.id}&section_id={section.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["attendance_percentage"] == 80.0

    def test_attendance_export(self, api_client, faculty_user, attendance_setup):
        """Test CSV export of attendance."""
        student = attendance_setup["student"]
        session = attendance_setup["session"]
        Attendance.objects.create(session=session, student=student, status="PRESENT", marked_by=faculty_user)

        api_client.force_authenticate(user=faculty_user)
        response = api_client.get("/api/attendance/export/")

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"
        assert b"Student Reg No,Student Name" in response.content
        assert student.reg_no.encode() in response.content

    def test_mark_session_not_found(self, api_client, faculty_user):
        """Test marking attendance for non-existent session."""
        api_client.force_authenticate(user=faculty_user)
        response = api_client.post("/api/attendance/sessions/9999/mark/", {})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_eligibility_missing_params(self, api_client, faculty_user):
        """Test eligibility check with missing parameters."""
        api_client.force_authenticate(user=faculty_user)
        response = api_client.get("/api/attendance/eligibility/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"]["code"] == "MISSING_PARAMS"
