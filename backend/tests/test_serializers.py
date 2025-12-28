"""Comprehensive serializer tests for all modules."""

import pytest
from django.utils import timezone

from sims_backend.academics.models import Course, Program, Section
from sims_backend.academics.serializers import (
    CourseSerializer,
    ProgramSerializer,
    SectionSerializer,
)
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment
from sims_backend.assessments.serializers import (
    AssessmentScoreSerializer,
    AssessmentSerializer,
)
from sims_backend.attendance.serializers import AttendanceSerializer
from sims_backend.enrollment.models import Enrollment
from sims_backend.enrollment.serializers import EnrollmentSerializer
from sims_backend.results.models import Result
from sims_backend.results.serializers import ResultSerializer

pytestmark = pytest.mark.django_db


class TestProgramSerializer:
    """Test Program serializer validation."""

    def test_valid_program(self):
        """Valid program data should serialize correctly."""
        data = {"name": "Bachelor of Science"}
        serializer = ProgramSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        program = serializer.save()
        assert program.name == "Bachelor of Science"

    def test_program_unique_name(self):
        """Program names should be unique."""
        Program.objects.create(name="BSc CS")
        data = {"name": "BSc CS"}
        serializer = ProgramSerializer(data=data)
        assert not serializer.is_valid()


class TestCourseSerializer:
    """Test Course serializer validation."""

    def test_valid_course(self):
        """Valid course data should serialize correctly."""
        program = Program.objects.create(name="BSc CS")
        data = {
            "code": "CS101",
            "title": "Introduction to Programming",
            "credits": 3,
            "program": program.id,
        }
        serializer = CourseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        course = serializer.save()
        assert course.code == "CS101"
        assert course.credits == 3

    def test_course_unique_code(self):
        """Course codes should be unique."""
        program = Program.objects.create(name="BSc CS")
        Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        data = {
            "code": "CS101",
            "title": "Different Course",
            "credits": 4,
            "program": program.id,
        }
        serializer = CourseSerializer(data=data)
        assert not serializer.is_valid()


class TestSectionSerializer:
    """Test Section serializer validation."""

    def test_valid_section(self):
        """Valid section data should serialize correctly."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        data = {
            "course": course.id,
            "term": "Fall 2024",
            "teacher": None,
            "teacher_name": "Dr. Smith",
        }
        serializer = SectionSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        section = serializer.save()
        assert section.term == "Fall 2024"
        assert section.teacher_name == "Dr. Smith"


class TestEnrollmentSerializer:
    """Test Enrollment serializer validation."""

    def test_valid_enrollment(self):
        """Valid enrollment should serialize correctly."""
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
        data = {"student": student.id, "section": section.id, "status": "enrolled"}
        serializer = EnrollmentSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        enrollment = serializer.save()
        assert enrollment.status == "enrolled"

    def test_duplicate_enrollment_prevented(self):
        """Duplicate enrollments should be prevented."""
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
        Enrollment.objects.create(student=student, section=section, status="enrolled")
        data = {"student": student.id, "section": section.id, "status": "enrolled"}
        serializer = EnrollmentSerializer(data=data)
        assert not serializer.is_valid()


class TestAttendanceSerializer:
    """Test Attendance serializer validation."""

    def test_valid_attendance(self):
        """Valid attendance should serialize correctly."""
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
        data = {
            "section": section.id,
            "student": student.id,
            "date": "2024-01-15",
            "present": True,
            "reason": "",
        }
        serializer = AttendanceSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        attendance = serializer.save()
        assert attendance.present is True

    def test_attendance_with_reason(self):
        """Absent students can have a reason."""
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
        data = {
            "section": section.id,
            "student": student.id,
            "date": "2024-01-15",
            "present": False,
            "reason": "Medical leave",
        }
        serializer = AttendanceSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        attendance = serializer.save()
        assert attendance.reason == "Medical leave"


class TestAssessmentSerializer:
    """Test Assessment serializer validation."""

    def test_valid_assessment(self):
        """Valid assessment should serialize correctly."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        data = {"section": section.id, "type": "Midterm", "weight": 30}
        serializer = AssessmentSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        assessment = serializer.save()
        assert assessment.type == "Midterm"
        assert assessment.weight == 30


class TestAssessmentScoreSerializer:
    """Test AssessmentScore serializer validation."""

    def test_valid_score(self):
        """Valid score should serialize correctly."""
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
        assessment = Assessment.objects.create(section=section, type="Quiz", weight=10)
        data = {
            "assessment": assessment.id,
            "student": student.id,
            "score": 85.5,
            "max_score": 100,
        }
        serializer = AssessmentScoreSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        score = serializer.save()
        assert score.score == 85.5


class TestResultSerializer:
    """Test Result serializer validation."""

    def test_valid_result(self):
        """Valid result should serialize correctly."""
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
        data = {
            "student": student.id,
            "section": section.id,
            "final_grade": "A",
            "published_at": None,
            "published_by": "",
        }
        serializer = ResultSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        result = serializer.save()
        assert result.final_grade == "A"

    def test_published_result(self):
        """Published results should have timestamp and publisher."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        now = timezone.now()
        # Create result with published fields directly
        result = Result.objects.create(
            student=student,
            section=section,
            final_grade="B+",
            is_published=True,
            published_at=now,
            published_by="registrar1",
        )
        serializer = ResultSerializer(result)
        assert serializer.data["is_published"] is True
        assert serializer.data["published_by"] == "registrar1"
        assert serializer.data["final_grade"] == "B+"
