"""Tests for enrollment capacity and assessment validation"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment
from sims_backend.enrollment.models import Enrollment


@pytest.fixture
def api_client():
    client = APIClient()
    user = User.objects.create_user(
        username="testuser", password="testpass", is_staff=True, is_superuser=True
    )
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_section_with_capacity():
    """Create a section with capacity"""
    program = Program.objects.create(name="Computer Science")
    course = Course.objects.create(
        code="CS101", title="Intro to CS", credits=3, program=program
    )
    section = Section.objects.create(
        course=course,
        term="Fall2024",
        teacher=None,
        teacher_name="Dr. Smith",
        capacity=2,
    )
    return section


@pytest.fixture
def sample_students():
    """Create sample students"""
    students = []
    for i in range(3):
        student = Student.objects.create(
            reg_no=f"202400{i+1}",
            name=f"Student {i+1}",
            program="CS",
            status="active",
        )
        students.append(student)
    return students


@pytest.mark.django_db
class TestEnrollmentCapacity:
    def test_enroll_within_capacity(
        self, api_client, sample_section_with_capacity, sample_students
    ):
        """Test enrolling within capacity"""
        section = sample_section_with_capacity
        student = sample_students[0]

        response = api_client.post(
            "/api/enrollments/",
            {
                "student": student.id,
                "section": section.id,
                "status": "enrolled",
            },
            format="json",
        )

        assert response.status_code == 201

    def test_enroll_at_full_capacity(
        self, api_client, sample_section_with_capacity, sample_students
    ):
        """Test enrolling when section is at capacity"""
        section = sample_section_with_capacity

        # Enroll two students (capacity = 2)
        Enrollment.objects.create(
            student=sample_students[0], section=section, status="enrolled"
        )
        Enrollment.objects.create(
            student=sample_students[1], section=section, status="enrolled"
        )

        # Try to enroll third student
        response = api_client.post(
            "/api/enrollments/",
            {
                "student": sample_students[2].id,
                "section": section.id,
                "status": "enrolled",
            },
            format="json",
        )

        assert response.status_code == 400
        assert "capacity" in response.data["section"][0].lower()

    def test_dropped_enrollment_frees_slot(
        self, api_client, sample_section_with_capacity, sample_students
    ):
        """Test that dropped enrollment doesn't count toward capacity"""
        section = sample_section_with_capacity

        # Enroll two students
        enrollment1 = Enrollment.objects.create(
            student=sample_students[0], section=section, status="enrolled"
        )
        Enrollment.objects.create(
            student=sample_students[1], section=section, status="enrolled"
        )

        # Drop one enrollment
        enrollment1.status = "dropped"
        enrollment1.save()

        # Should now be able to enroll another student
        response = api_client.post(
            "/api/enrollments/",
            {
                "student": sample_students[2].id,
                "section": section.id,
                "status": "enrolled",
            },
            format="json",
        )

        assert response.status_code == 201

    def test_section_default_capacity(self, api_client):
        """Test that sections have default capacity"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS102", title="Data Structures", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Jones"
        )

        assert section.capacity == 30  # Default capacity


@pytest.mark.django_db
class TestAssessmentScoreValidation:
    def test_score_within_max_score(self, api_client):
        """Test that score within max_score is accepted"""
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
            section=section, type="Midterm", weight=30
        )

        response = api_client.post(
            "/api/assessment-scores/",
            {
                "assessment": assessment.id,
                "student": student.id,
                "score": 85.0,
                "max_score": 100.0,
            },
            format="json",
        )

        assert response.status_code == 201

    def test_score_exceeds_max_score(self, api_client):
        """Test that score exceeding max_score is rejected"""
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
            section=section, type="Midterm", weight=30
        )

        response = api_client.post(
            "/api/assessment-scores/",
            {
                "assessment": assessment.id,
                "student": student.id,
                "score": 105.0,
                "max_score": 100.0,
            },
            format="json",
        )

        assert response.status_code == 400
        assert "exceed" in response.data["score"][0].lower()

    def test_negative_score(self, api_client):
        """Test that negative score is rejected"""
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
            section=section, type="Midterm", weight=30
        )

        response = api_client.post(
            "/api/assessment-scores/",
            {
                "assessment": assessment.id,
                "student": student.id,
                "score": -10.0,
                "max_score": 100.0,
            },
            format="json",
        )

        assert response.status_code == 400
        assert "negative" in response.data["score"][0].lower()

    def test_zero_or_negative_max_score(self, api_client):
        """Test that zero or negative max_score is rejected"""
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
            section=section, type="Midterm", weight=30
        )

        response = api_client.post(
            "/api/assessment-scores/",
            {
                "assessment": assessment.id,
                "student": student.id,
                "score": 50.0,
                "max_score": 0.0,
            },
            format="json",
        )

        assert response.status_code == 400
        # When max_score is 0, score will exceed it
        assert "score" in response.data or "max_score" in response.data


@pytest.mark.django_db
class TestAssessmentWeightValidation:
    def test_weight_within_100_percent(self, api_client):
        """Test that assessments within 100% total weight are accepted"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )

        # Create assessments totaling 100%
        Assessment.objects.create(section=section, type="Midterm", weight=30)
        Assessment.objects.create(section=section, type="Final", weight=40)

        response = api_client.post(
            "/api/assessments/",
            {"section": section.id, "type": "Quizzes", "weight": 30},
            format="json",
        )

        assert response.status_code == 201

    def test_weight_exceeds_100_percent(self, api_client):
        """Test that assessments exceeding 100% total weight are rejected"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )

        # Create assessments totaling 90%
        Assessment.objects.create(section=section, type="Midterm", weight=40)
        Assessment.objects.create(section=section, type="Final", weight=50)

        # Try to add another 20% (would exceed 100%)
        response = api_client.post(
            "/api/assessments/",
            {"section": section.id, "type": "Quizzes", "weight": 20},
            format="json",
        )

        assert response.status_code == 400
        assert "100" in response.data["weight"][0]
        assert "exceed" in response.data["weight"][0].lower()

    def test_update_weight_within_limit(self, api_client):
        """Test updating assessment weight within 100% limit"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )

        assessment1 = Assessment.objects.create(
            section=section, type="Midterm", weight=30
        )
        Assessment.objects.create(section=section, type="Final", weight=40)

        # Update first assessment to 35% (total would be 75%)
        response = api_client.patch(
            f"/api/assessments/{assessment1.id}/",
            {"weight": 35},
            format="json",
        )

        assert response.status_code == 200

    def test_update_weight_exceeds_limit(self, api_client):
        """Test updating assessment weight that would exceed 100%"""
        program = Program.objects.create(name="Computer Science")
        course = Course.objects.create(
            code="CS101", title="Intro to CS", credits=3, program=program
        )
        section = Section.objects.create(
            course=course, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
        )

        assessment1 = Assessment.objects.create(
            section=section, type="Midterm", weight=30
        )
        Assessment.objects.create(section=section, type="Final", weight=50)

        # Try to update first assessment to 60% (total would be 110%)
        response = api_client.patch(
            f"/api/assessments/{assessment1.id}/",
            {"weight": 60},
            format="json",
        )

        assert response.status_code == 400
        assert "100" in response.data["weight"][0]
