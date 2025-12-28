"""Comprehensive view tests for all modules."""

import pytest
from rest_framework import status

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment
from sims_backend.attendance.models import Attendance
from sims_backend.enrollment.models import Enrollment
from sims_backend.results.models import Result

pytestmark = pytest.mark.django_db


class TestProgramViews:
    """Test Program CRUD views."""

    def test_list_programs(self, api_client, admin_user):
        """Test listing programs."""
        Program.objects.create(name="BSc Computer Science")
        Program.objects.create(name="MSc Data Science")
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/programs/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 2

    def test_create_program(self, api_client, admin_user):
        """Test creating a program."""
        api_client.force_authenticate(admin_user)

        resp = api_client.post(
            "/api/programs/",
            {"name": "New Program"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert Program.objects.filter(name="New Program").exists()

    def test_search_programs(self, api_client, admin_user):
        """Test searching programs."""
        Program.objects.create(name="Computer Science")
        Program.objects.create(name="Data Science")
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/programs/?search=Computer")
        assert resp.status_code == status.HTTP_200_OK
        results = resp.json()["results"]
        assert len(results) >= 1
        assert "Computer" in results[0]["name"]

    def test_ordering_programs(self, api_client, admin_user):
        """Test ordering programs."""
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/programs/?ordering=name")
        assert resp.status_code == status.HTTP_200_OK


class TestCourseViews:
    """Test Course CRUD views."""

    def test_list_courses(self, api_client, admin_user):
        """Test listing courses."""
        program = Program.objects.create(name="BSc CS")
        Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/courses/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1

    def test_create_course(self, api_client, admin_user):
        """Test creating a course."""
        program = Program.objects.create(name="BSc CS")
        api_client.force_authenticate(admin_user)

        resp = api_client.post(
            "/api/courses/",
            {
                "code": "CS201",
                "title": "Data Structures",
                "credits": 4,
                "program": program.id,
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

    def test_search_courses(self, api_client, admin_user):
        """Test searching courses."""
        program = Program.objects.create(name="BSc CS")
        Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        Course.objects.create(
            code="CS201", title="Algorithms", credits=4, program=program
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/courses/?search=CS101")
        assert resp.status_code == status.HTTP_200_OK
        results = resp.json()["results"]
        assert len(results) >= 1


class TestSectionViews:
    """Test Section CRUD views."""

    def test_list_sections(self, api_client, admin_user):
        """Test listing sections."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/sections/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1

    def test_search_sections(self, api_client, admin_user):
        """Test searching sections."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/sections/?search=Smith")
        assert resp.status_code == status.HTTP_200_OK


class TestAttendanceViews:
    """Test Attendance views."""

    def test_list_attendance(self, api_client, admin_user):
        """Test listing attendance records."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        Attendance.objects.create(
            section=section, student=student, date="2024-01-15", present=True
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/attendance/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1

    def test_create_attendance(self, api_client, admin_user):
        """Test creating attendance record."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.post(
            "/api/attendance/",
            {
                "section": section.id,
                "student": student.id,
                "date": "2024-01-16",
                "present": True,
                "reason": "",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

    def test_search_attendance(self, api_client, admin_user):
        """Test searching attendance records."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        Attendance.objects.create(
            section=section, student=student, date="2024-01-15", present=True
        )
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/attendance/?search=STU-001")
        assert resp.status_code == status.HTTP_200_OK


class TestAssessmentViews:
    """Test Assessment views."""

    def test_list_assessments(self, api_client, admin_user):
        """Test listing assessments."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        Assessment.objects.create(section=section, type="Midterm", weight=30)
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/assessments/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1


class TestResultViews:
    """Test Result views."""

    def test_list_results(self, api_client, admin_user):
        """Test listing results."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        Result.objects.create(student=student, section=section, final_grade="A")
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/results/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1


class TestEnrollmentFiltering:
    """Test enrollment filtering and querying."""

    def test_filter_by_student(self, api_client, admin_user):
        """Test filtering enrollments by student."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        Enrollment.objects.create(student=student, section=section)
        api_client.force_authenticate(admin_user)

        resp = api_client.get("/api/enrollments/?search=STU-001")
        assert resp.status_code == status.HTTP_200_OK
