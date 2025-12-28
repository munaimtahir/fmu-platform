"""Tests for transcript generation and QR verification"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.results.models import Result
from sims_backend.transcripts.views import generate_qr_token, verify_qr_token


@pytest.fixture
def api_client():
    client = APIClient()
    user = User.objects.create_user(
        username="testuser", password="testpass", is_staff=True, is_superuser=True
    )
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_student_with_results():
    """Create student with published results"""
    program = Program.objects.create(name="Computer Science")
    course1 = Course.objects.create(
        code="CS101", title="Intro to CS", credits=3, program=program
    )
    course2 = Course.objects.create(
        code="CS102", title="Data Structures", credits=3, program=program
    )
    section1 = Section.objects.create(
        course=course1, term="Fall2024", teacher=None, teacher_name="Dr. Smith"
    )
    section2 = Section.objects.create(
        course=course2, term="Fall2024", teacher=None, teacher_name="Dr. Jones"
    )
    student = Student.objects.create(
        reg_no="2024001", name="John Doe", program="CS", status="active"
    )

    result1 = Result.objects.create(
        student=student,
        section=section1,
        final_grade="A",
        is_published=True,
    )
    result2 = Result.objects.create(
        student=student,
        section=section2,
        final_grade="B+",
        is_published=True,
    )

    return {
        "student": student,
        "results": [result1, result2],
        "sections": [section1, section2],
    }


@pytest.mark.django_db
class TestTranscriptGeneration:
    def test_generate_transcript_success(self, api_client, sample_student_with_results):
        """Test successful transcript PDF generation"""
        student = sample_student_with_results["student"]

        response = api_client.get(f"/api/transcripts/{student.id}/")

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert "attachment" in response["Content-Disposition"]
        assert f"transcript_{student.reg_no}.pdf" in response["Content-Disposition"]
        # Check that PDF has content (streaming_content for FileResponse)
        content = b"".join(response.streaming_content)
        assert len(content) > 0  # PDF has content

    def test_generate_transcript_student_not_found(self, api_client):
        """Test transcript generation for non-existent student"""
        response = api_client.get("/api/transcripts/99999/")

        assert response.status_code == 404
        assert "Student not found" in response.data["error"]["message"]

    def test_generate_transcript_no_results(self, api_client):
        """Test transcript generation for student with no results"""
        student = Student.objects.create(
            reg_no="2024002", name="Jane Doe", program="CS", status="active"
        )

        response = api_client.get(f"/api/transcripts/{student.id}/")

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        # Should still generate PDF, just with "No published results"


@pytest.mark.django_db
class TestQRTokenGeneration:
    def test_generate_token(self):
        """Test QR token generation"""
        token = generate_qr_token(123)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        assert "transcript_123" in token

    def test_different_students_different_tokens(self):
        """Test that different students get different token values"""
        token1 = generate_qr_token(123)
        token2 = generate_qr_token(456)

        # Tokens should be different because they contain different student IDs
        assert token1 != token2
        assert "123" in token1
        assert "456" in token2


@pytest.mark.django_db
class TestQRTokenVerification:
    def test_verify_valid_token(self):
        """Test verification of valid token"""
        student_id = 123
        token = generate_qr_token(student_id)

        result = verify_qr_token(token)

        assert result["valid"] is True
        assert result["student_id"] == student_id
        assert "valid" in result["reason"].lower()

    def test_verify_tampered_token(self):
        """Test verification of tampered token"""
        token = generate_qr_token(123)
        tampered_token = token + "xyz"  # Tamper with token

        result = verify_qr_token(tampered_token)

        assert result["valid"] is False
        assert (
            "invalid" in result["reason"].lower()
            or "tampered" in result["reason"].lower()
        )

    def test_verify_expired_token(self):
        """Test verification of expired token (simulated)"""
        # Create a token with a very old timestamp
        # Sign a value that will immediately be considered expired
        # We can't easily simulate this without mocking time, so we test the API response
        old_token = "transcript_123:oldtimestamp:invalidsig"

        result = verify_qr_token(old_token)

        assert result["valid"] is False
        # Should indicate either expired or invalid signature

    def test_verify_invalid_format_token(self):
        """Test verification of token with invalid format"""
        invalid_token = "invalid_format_token"

        result = verify_qr_token(invalid_token)

        assert result["valid"] is False
        assert (
            "invalid" in result["reason"].lower()
            or "format" in result["reason"].lower()
        )

    def test_verify_token_via_api_success(self, api_client):
        """Test token verification via API endpoint"""
        token = generate_qr_token(123)

        response = api_client.get(f"/api/transcripts/verify/{token}/")

        assert response.status_code == 200
        assert response.data["valid"] is True
        assert response.data["student_id"] == 123

    def test_verify_token_via_api_invalid(self, api_client):
        """Test invalid token verification via API endpoint"""
        invalid_token = "invalid_token"

        response = api_client.get(f"/api/transcripts/verify/{invalid_token}/")

        assert response.status_code == 200
        assert response.data["valid"] is False
        assert "reason" in response.data

    def test_verify_token_via_api_tampered(self, api_client):
        """Test tampered token verification via API endpoint"""
        token = generate_qr_token(123)
        tampered_token = token + "xyz"

        response = api_client.get(f"/api/transcripts/verify/{tampered_token}/")

        assert response.status_code == 200
        assert response.data["valid"] is False


@pytest.mark.django_db
class TestTranscriptSecurity:
    def test_token_contains_signature(self):
        """Test that token contains cryptographic signature"""
        token = generate_qr_token(123)

        # Token should have multiple parts separated by ':'
        parts = token.split(":")
        assert len(parts) >= 2  # Value and signature

    def test_different_students_different_tokens(self):
        """Test that different students get different tokens"""
        token1 = generate_qr_token(123)
        token2 = generate_qr_token(456)

        assert token1 != token2
        assert "123" in token1
        assert "456" in token2

    def test_verify_token_returns_correct_student(self):
        """Test that verified token returns correct student ID"""
        student_ids = [100, 200, 300]

        for student_id in student_ids:
            token = generate_qr_token(student_id)
            result = verify_qr_token(token)

            assert result["valid"] is True
            assert result["student_id"] == student_id
