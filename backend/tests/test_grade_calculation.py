"""Tests for grade calculation utilities"""

import pytest

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment, AssessmentScore
from sims_backend.results.utils import calculate_final_grade, calculate_grade


@pytest.mark.django_db
class TestGradeCalculation:
    def test_calculate_grade_a_plus(self):
        """Test A+ grade (90-100%)"""
        assert calculate_grade(95.0) == "A+"
        assert calculate_grade(90.0) == "A+"
        assert calculate_grade(100.0) == "A+"

    def test_calculate_grade_a(self):
        """Test A grade (85-89%)"""
        assert calculate_grade(87.5) == "A"
        assert calculate_grade(85.0) == "A"
        assert calculate_grade(89.9) == "A"

    def test_calculate_grade_b_plus(self):
        """Test B+ grade (80-84%)"""
        assert calculate_grade(82.0) == "B+"
        assert calculate_grade(80.0) == "B+"
        assert calculate_grade(84.9) == "B+"

    def test_calculate_grade_b(self):
        """Test B grade (75-79%)"""
        assert calculate_grade(77.0) == "B"
        assert calculate_grade(75.0) == "B"
        assert calculate_grade(79.9) == "B"

    def test_calculate_grade_c_plus(self):
        """Test C+ grade (70-74%)"""
        assert calculate_grade(72.0) == "C+"
        assert calculate_grade(70.0) == "C+"
        assert calculate_grade(74.9) == "C+"

    def test_calculate_grade_c(self):
        """Test C grade (65-69%)"""
        assert calculate_grade(67.0) == "C"
        assert calculate_grade(65.0) == "C"
        assert calculate_grade(69.9) == "C"

    def test_calculate_grade_d(self):
        """Test D grade (60-64%)"""
        assert calculate_grade(62.0) == "D"
        assert calculate_grade(60.0) == "D"
        assert calculate_grade(64.9) == "D"

    def test_calculate_grade_f(self):
        """Test F grade (<60%)"""
        assert calculate_grade(59.9) == "F"
        assert calculate_grade(50.0) == "F"
        assert calculate_grade(0.0) == "F"

    def test_calculate_grade_boundaries(self):
        """Test grade boundaries precisely"""
        assert calculate_grade(89.99) == "A"
        assert calculate_grade(90.0) == "A+"
        assert calculate_grade(84.99) == "B+"
        assert calculate_grade(85.0) == "A"
        assert calculate_grade(59.99) == "F"
        assert calculate_grade(60.0) == "D"


@pytest.mark.django_db
class TestFinalGradeCalculation:
    def test_calculate_final_grade_simple(self):
        """Test final grade calculation with simple assessment"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        # Create one assessment worth 100%
        assessment = Assessment.objects.create(
            section=section, type="Final", weight=100
        )
        AssessmentScore.objects.create(
            assessment=assessment, student=student, score=85.0, max_score=100.0
        )

        result = calculate_final_grade(student.id, section.id)

        assert result["percentage"] == 85.0
        assert result["grade"] == "A"
        assert result["total_weight_assessed"] == 100
        assert len(result["components"]) == 1

    def test_calculate_final_grade_multiple_assessments(self):
        """Test final grade calculation with multiple assessments"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        # Create assessments
        midterm = Assessment.objects.create(section=section, type="Midterm", weight=30)
        final = Assessment.objects.create(section=section, type="Final", weight=40)
        quizzes = Assessment.objects.create(section=section, type="Quizzes", weight=30)

        # Add scores
        AssessmentScore.objects.create(
            assessment=midterm, student=student, score=80.0, max_score=100.0
        )
        AssessmentScore.objects.create(
            assessment=final, student=student, score=90.0, max_score=100.0
        )
        AssessmentScore.objects.create(
            assessment=quizzes, student=student, score=85.0, max_score=100.0
        )

        result = calculate_final_grade(student.id, section.id)

        # Expected: (80*30 + 90*40 + 85*30) / 100 = 85.5
        assert result["percentage"] == 85.5
        assert result["grade"] == "A"
        assert result["total_weight_assessed"] == 100
        assert len(result["components"]) == 3

    def test_calculate_final_grade_missing_score(self):
        """Test final grade calculation with missing assessment score"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        # Create assessments
        midterm = Assessment.objects.create(section=section, type="Midterm", weight=50)
        Assessment.objects.create(section=section, type="Final", weight=50)

        # Add score for only one assessment
        AssessmentScore.objects.create(
            assessment=midterm, student=student, score=80.0, max_score=100.0
        )
        # No score for final

        result = calculate_final_grade(student.id, section.id)

        # Expected: (80*50 + 0*50) / 100 = 40
        assert result["percentage"] == 40.0
        assert result["grade"] == "F"
        assert len(result["components"]) == 2

    def test_calculate_final_grade_different_max_scores(self):
        """Test final grade calculation with different max scores"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        # Create assessment
        assessment = Assessment.objects.create(
            section=section, type="Midterm", weight=100
        )
        # Score 40 out of 50 (80%)
        AssessmentScore.objects.create(
            assessment=assessment, student=student, score=40.0, max_score=50.0
        )

        result = calculate_final_grade(student.id, section.id)

        assert result["percentage"] == 80.0
        assert result["grade"] == "B+"

    def test_calculate_final_grade_no_assessments(self):
        """Test final grade calculation with no assessments"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        result = calculate_final_grade(student.id, section.id)

        assert result["percentage"] == 0.0
        assert result["grade"] == "F"
        assert result["total_weight_assessed"] == 0.0
        assert len(result["components"]) == 0

    def test_calculate_final_grade_partial_weight(self):
        """Test final grade calculation with partial weight"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        # Create assessments totaling 60% (partial)
        midterm = Assessment.objects.create(section=section, type="Midterm", weight=30)
        quizzes = Assessment.objects.create(section=section, type="Quizzes", weight=30)

        AssessmentScore.objects.create(
            assessment=midterm, student=student, score=80.0, max_score=100.0
        )
        AssessmentScore.objects.create(
            assessment=quizzes, student=student, score=90.0, max_score=100.0
        )

        result = calculate_final_grade(student.id, section.id)

        # Expected: (80*30 + 90*30) / 100 = 51
        assert result["percentage"] == 51.0
        assert result["grade"] == "F"
        assert result["total_weight_assessed"] == 60

    def test_calculate_final_grade_component_details(self):
        """Test that component details are included"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )
        student = Student.objects.create(
            reg_no="2024001", name="John Doe", program="CS", status="active"
        )

        assessment = Assessment.objects.create(
            section=section, type="Midterm", weight=100
        )
        AssessmentScore.objects.create(
            assessment=assessment, student=student, score=85.0, max_score=100.0
        )

        result = calculate_final_grade(student.id, section.id)

        components = result["components"]
        assert len(components) == 1
        assert components[0]["type"] == "Midterm"
        assert components[0]["score"] == 85.0
        assert components[0]["max_score"] == 100.0
        assert components[0]["weight"] == 100
        assert components[0]["weighted_contribution"] == 85.0
