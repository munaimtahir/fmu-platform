"""Comprehensive model tests."""

import pytest
from django.db import IntegrityError

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment, AssessmentScore
from sims_backend.attendance.models import Attendance
from sims_backend.audit.models import AuditLog
from sims_backend.enrollment.models import Enrollment
from sims_backend.results.models import Result

pytestmark = pytest.mark.django_db


class TestStudentModel:
    """Test Student model."""

    def test_str_representation(self):
        """Test student string representation."""
        student = Student.objects.create(
            reg_no="STU-001", name="John Doe", program="BSc CS", status="active"
        )
        assert str(student) == "STU-001 - John Doe"
        # Explicitly call __str__ to ensure 100% coverage
        assert student.__str__() == "STU-001 - John Doe"

    def test_unique_reg_no(self):
        """Test that reg_no must be unique."""
        Student.objects.create(
            reg_no="STU-001", name="John", program="BSc", status="active"
        )
        with pytest.raises(IntegrityError):
            Student.objects.create(
                reg_no="STU-001", name="Jane", program="MSc", status="active"
            )

    def test_ordering(self):
        """Test students are ordered by reg_no."""
        Student.objects.create(
            reg_no="STU-003", name="Third", program="BSc", status="active"
        )
        Student.objects.create(
            reg_no="STU-001", name="First", program="BSc", status="active"
        )
        Student.objects.create(
            reg_no="STU-002", name="Second", program="BSc", status="active"
        )
        students = list(Student.objects.all())
        assert students[0].reg_no == "STU-001"
        assert students[1].reg_no == "STU-002"
        assert students[2].reg_no == "STU-003"


class TestProgramModel:
    """Test Program model."""

    def test_str_representation(self):
        """Test program string representation."""
        program = Program.objects.create(name="Bachelor of Science")
        assert str(program) == "Bachelor of Science"
        # Explicitly call __str__ to ensure 100% coverage
        assert program.__str__() == "Bachelor of Science"

    def test_unique_name(self):
        """Test that program name must be unique."""
        Program.objects.create(name="BSc CS")
        with pytest.raises(IntegrityError):
            Program.objects.create(name="BSc CS")


class TestCourseModel:
    """Test Course model."""

    def test_str_representation(self):
        """Test course string representation."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101",
            title="Introduction to Programming",
            credits=3,
            program=program,
        )
        assert str(course) == "CS101 - Introduction to Programming"
        # Explicitly call __str__ to ensure 100% coverage
        assert course.__str__() == "CS101 - Introduction to Programming"

    def test_unique_code(self):
        """Test that course code must be unique."""
        program = Program.objects.create(name="BSc CS")
        Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        with pytest.raises(IntegrityError):
            Course.objects.create(
                code="CS101", title="Different Course", credits=4, program=program
            )

    def test_default_credits(self):
        """Test default credits value."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", program=program
        )
        assert course.credits == 3


class TestSectionModel:
    """Test Section model."""

    def test_str_representation(self):
        """Test section string representation."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        assert str(section) == "CS101 Fall 2024 (Dr. Smith)"

    def test_unique_together(self):
        """Test unique constraint on course, term, teacher.

        Note: NULL values in unique_together constraints are not considered equal,
        so multiple sections with the same course/term but teacher=None are allowed.
        The constraint only applies when teacher is not NULL.
        """
        from django.contrib.auth import get_user_model
        from django.db import transaction

        user_model = get_user_model()

        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        teacher = user_model.objects.create_user(
            username="drsmith", email="drsmith@test.com"
        )

        # Create first section with a teacher
        Section.objects.create(course=course, term="Fall 2024", teacher=teacher)

        # Attempting to create duplicate should raise IntegrityError
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Section.objects.create(course=course, term="Fall 2024", teacher=teacher)

        # However, multiple sections with teacher=None are allowed (NULL values are not equal)
        Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Jones"
        )
        Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Brown"
        )


class TestEnrollmentModel:
    """Test Enrollment model."""

    def test_default_status(self):
        """Test default enrollment status."""
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
        enrollment = Enrollment.objects.create(student=student, section=section)
        assert enrollment.status == "enrolled"

    def test_unique_together(self):
        """Test unique constraint on student and section."""
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
        with pytest.raises(IntegrityError):
            Enrollment.objects.create(student=student, section=section)


class TestAttendanceModel:
    """Test Attendance model."""

    def test_default_present(self):
        """Test default present value."""
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
        attendance = Attendance.objects.create(
            section=section, student=student, date="2024-01-15"
        )
        assert attendance.present is True
        assert attendance.reason == ""

    def test_unique_together(self):
        """Test unique constraint on section, student, and date."""
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
        with pytest.raises(IntegrityError):
            Attendance.objects.create(
                section=section, student=student, date="2024-01-15", present=False
            )


class TestAssessmentModel:
    """Test Assessment model."""

    def test_default_weight(self):
        """Test default assessment weight."""
        program = Program.objects.create(name="BSc CS")
        course = Course.objects.create(
            code="CS101", title="Programming", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall 2024", teacher=None, teacher_name="Dr. Smith"
        )
        assessment = Assessment.objects.create(section=section, type="Quiz")
        assert assessment.weight == 10


class TestAssessmentScoreModel:
    """Test AssessmentScore model."""

    def test_default_values(self):
        """Test default score values."""
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
        assessment = Assessment.objects.create(section=section, type="Quiz")
        score = AssessmentScore.objects.create(assessment=assessment, student=student)
        assert score.score == 0
        assert score.max_score == 100

    def test_unique_together(self):
        """Test unique constraint on assessment and student."""
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
        assessment = Assessment.objects.create(section=section, type="Quiz")
        AssessmentScore.objects.create(assessment=assessment, student=student, score=85)
        with pytest.raises(IntegrityError):
            AssessmentScore.objects.create(
                assessment=assessment, student=student, score=90
            )


class TestResultModel:
    """Test Result model."""

    def test_default_values(self):
        """Test default result values."""
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
        result = Result.objects.create(student=student, section=section)
        assert result.final_grade == ""
        assert result.published_at is None
        assert result.published_by == ""


class TestAuditLogModel:
    """Test AuditLog model."""

    def test_create_audit_log(self):
        """Test creating an audit log entry."""
        log = AuditLog.objects.create(
            method="POST",
            path="/api/students/",
            status_code=201,
            model="Student",
            object_id="123",
            summary="POST Student #123",
        )
        assert log.method == "POST"
        assert log.status_code == 201
        assert log.model == "Student"
