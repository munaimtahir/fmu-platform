"""Tests for attendance percentage calculation and eligibility."""

import pytest
from rest_framework import status

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.attendance.models import Attendance
from sims_backend.attendance.utils import (
    calculate_attendance_percentage,
    check_eligibility,
    get_section_attendance_summary,
)

pytestmark = pytest.mark.django_db


class TestAttendancePercentageCalculation:
    """Test attendance percentage calculation utilities."""

    def test_calculate_attendance_percentage_full_attendance(self):
        """Test 100% attendance calculation."""
        student = Student.objects.create(
            reg_no="STU-ATT-001", name="Full Attendance", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )

        # Create 10 days of attendance, all present
        for day in range(1, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-01-{day:02d}",
                present=True,
            )

        percentage = calculate_attendance_percentage(student.id, section.id)
        assert percentage == 100.0

    def test_calculate_attendance_percentage_partial(self):
        """Test partial attendance calculation."""
        student = Student.objects.create(
            reg_no="STU-ATT-002",
            name="Partial Attendance",
            program="BSc",
            status="active",
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS102", title="Data Structures", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Jones"
        )

        # Create 10 days: 8 present, 2 absent = 80%
        for day in range(1, 9):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-02-{day:02d}",
                present=True,
            )
        for day in range(9, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-02-{day:02d}",
                present=False,
            )

        percentage = calculate_attendance_percentage(student.id, section.id)
        assert percentage == 80.0

    def test_calculate_attendance_percentage_zero_records(self):
        """Test attendance with no records."""
        student = Student.objects.create(
            reg_no="STU-ATT-003", name="No Records", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS103", title="Algorithms", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Brown"
        )

        percentage = calculate_attendance_percentage(student.id, section.id)
        assert percentage == 0.0

    def test_calculate_attendance_percentage_boundary_75(self):
        """Test attendance at exactly 75% threshold."""
        student = Student.objects.create(
            reg_no="STU-ATT-004", name="Boundary Case", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS104", title="Networks", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. White"
        )

        # Create 20 days: 15 present (75%), 5 absent
        for day in range(1, 16):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-03-{day:02d}",
                present=True,
            )
        for day in range(16, 21):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-03-{day:02d}",
                present=False,
            )

        percentage = calculate_attendance_percentage(student.id, section.id)
        assert percentage == 75.0


class TestEligibilityCheck:
    """Test eligibility checking based on attendance."""

    def test_check_eligibility_eligible(self):
        """Test student is eligible with >= 75% attendance."""
        student = Student.objects.create(
            reg_no="STU-ELI-001",
            name="Eligible Student",
            program="BSc",
            status="active",
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS201", title="Database", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Green"
        )

        # 80% attendance
        for day in range(1, 9):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-04-{day:02d}",
                present=True,
            )
        for day in range(9, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-04-{day:02d}",
                present=False,
            )

        result = check_eligibility(student.id, section.id)
        assert result["eligible"] is True
        assert result["attendance_percentage"] == 80.0
        assert result["threshold"] == 75.0

    def test_check_eligibility_ineligible(self):
        """Test student is ineligible with < 75% attendance."""
        student = Student.objects.create(
            reg_no="STU-ELI-002",
            name="Ineligible Student",
            program="BSc",
            status="active",
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS202", title="OS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Black"
        )

        # 60% attendance
        for day in range(1, 7):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-05-{day:02d}",
                present=True,
            )
        for day in range(7, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-05-{day:02d}",
                present=False,
            )

        result = check_eligibility(student.id, section.id)
        assert result["eligible"] is False
        assert result["attendance_percentage"] == 60.0

    def test_check_eligibility_custom_threshold(self):
        """Test eligibility with custom threshold."""
        student = Student.objects.create(
            reg_no="STU-ELI-003",
            name="Custom Threshold",
            program="BSc",
            status="active",
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS203", title="AI", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Gray"
        )

        # 70% attendance
        for day in range(1, 8):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-06-{day:02d}",
                present=True,
            )
        for day in range(8, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-06-{day:02d}",
                present=False,
            )

        # With 70% threshold, should be eligible
        result = check_eligibility(student.id, section.id, threshold=70.0)
        assert result["eligible"] is True
        assert result["threshold"] == 70.0

        # With 75% threshold, should be ineligible
        result = check_eligibility(student.id, section.id, threshold=75.0)
        assert result["eligible"] is False


class TestSectionAttendanceSummary:
    """Test section attendance summary."""

    def test_section_summary_complete(self):
        """Test complete section attendance summary."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS301", title="ML", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Blue"
        )

        # Create students and attendance
        for i in range(1, 4):
            student = Student.objects.create(
                reg_no=f"STU-SUM-{i:03d}",
                name=f"Student {i}",
                program="BSc",
                status="active",
            )
            Attendance.objects.create(
                section=section, student=student, date="2024-07-01", present=True
            )
            Attendance.objects.create(
                section=section, student=student, date="2024-07-02", present=i != 1
            )

        summary = get_section_attendance_summary(section.id)
        assert summary["total_records"] == 6  # 3 students x 2 days
        assert summary["present_count"] == 5  # All on day 1, 2/3 on day 2
        assert summary["absent_count"] == 1
        assert summary["overall_percentage"] == pytest.approx(83.33, rel=0.1)


class TestAttendanceAPIEndpoints:
    """Test attendance API endpoints."""

    def test_attendance_percentage_endpoint(self, api_client, admin_user):
        """Test attendance percentage API endpoint."""
        student = Student.objects.create(
            reg_no="STU-API-001", name="API Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS401", title="Security", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Red"
        )

        # 75% attendance
        for day in range(1, 16):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-08-{day:02d}",
                present=True,
            )
        for day in range(16, 21):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-08-{day:02d}",
                present=False,
            )

        api_client.force_authenticate(admin_user)
        resp = api_client.get(
            f"/api/attendance/percentage/?student_id={student.id}&section_id={section.id}"
        )

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["percentage"] == 75.0

    def test_eligibility_endpoint(self, api_client, admin_user):
        """Test eligibility check API endpoint."""
        student = Student.objects.create(
            reg_no="STU-API-002",
            name="Eligibility Test",
            program="BSc",
            status="active",
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS402", title="Cloud", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Yellow"
        )

        # 80% attendance
        for day in range(1, 9):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-09-{day:02d}",
                present=True,
            )
        for day in range(9, 11):
            Attendance.objects.create(
                section=section,
                student=student,
                date=f"2024-09-{day:02d}",
                present=False,
            )

        api_client.force_authenticate(admin_user)
        resp = api_client.get(
            f"/api/attendance/eligibility/?student_id={student.id}&section_id={section.id}"
        )

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["eligible"] is True
        assert data["attendance_percentage"] == 80.0

    def test_section_summary_endpoint(self, api_client, admin_user):
        """Test section summary API endpoint."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS403", title="Blockchain", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Purple"
        )

        student = Student.objects.create(
            reg_no="STU-API-003", name="Summary Test", program="BSc", status="active"
        )
        Attendance.objects.create(
            section=section, student=student, date="2024-10-01", present=True
        )
        Attendance.objects.create(
            section=section, student=student, date="2024-10-02", present=False
        )

        api_client.force_authenticate(admin_user)
        resp = api_client.get(
            f"/api/attendance/section-summary/?section_id={section.id}"
        )

        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["total_records"] == 2
        assert data["present_count"] == 1
        assert data["absent_count"] == 1

    def test_attendance_percentage_missing_params(self, api_client, admin_user):
        """Test attendance percentage endpoint with missing parameters."""
        api_client.force_authenticate(admin_user)
        resp = api_client.get("/api/attendance/percentage/")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in resp.json()

    def test_attendance_percentage_invalid_ids(self, api_client, admin_user):
        """Test attendance percentage with invalid IDs."""
        api_client.force_authenticate(admin_user)
        resp = api_client.get(
            "/api/attendance/percentage/?student_id=invalid&section_id=also_invalid"
        )

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in resp.json()

    def test_eligibility_invalid_ids(self, api_client, admin_user):
        """Test eligibility endpoint with invalid IDs."""
        api_client.force_authenticate(admin_user)
        resp = api_client.get(
            "/api/attendance/eligibility/?student_id=invalid&section_id=999999"
        )

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in resp.json()

    def test_section_summary_invalid_id(self, api_client, admin_user):
        """Test section summary with invalid section ID."""
        api_client.force_authenticate(admin_user)
        resp = api_client.get("/api/attendance/section-summary/?section_id=invalid")

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in resp.json()
