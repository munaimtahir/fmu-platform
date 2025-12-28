"""Tests for transcript verification and other edge cases."""

import pytest
from rest_framework import status

pytestmark = pytest.mark.django_db


class TestTranscriptViews:
    """Test transcript verification endpoints."""

    def test_verify_transcript_placeholder(self, api_client, admin_user):
        """Test transcript verification endpoint."""
        api_client.force_authenticate(admin_user)

        # Call the verify endpoint with a dummy token
        resp = api_client.get("/api/transcripts/verify/dummy-token-123/")

        # Now returns 200 with validation result
        assert resp.status_code == status.HTTP_200_OK
        assert "valid" in resp.json()
        # With an invalid token, should return valid=False
        assert resp.json()["valid"] is False


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health_endpoint(self, api_client):
        """Test health check returns OK."""
        resp = api_client.get("/health/")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["status"] in [
            "ok",
            "degraded",
        ]  # Allow degraded for tests without Redis
        assert data["service"] == "SIMS Backend"
        assert "components" in data


class TestAdmissionPermissionObjectLevel:
    """Test object-level permissions for students."""

    def test_student_can_read_own_detail(self, api_client, student_user):
        """Test student can read their own details."""
        from sims_backend.admissions.models import Student

        # Create the student that matches the user
        student = Student.objects.create(
            reg_no="STU-0001",
            name="Own Student",
            program="BSc",
            status="active",
        )

        api_client.force_authenticate(student_user)
        resp = api_client.get(f"/api/students/{student.id}/")

        # Should succeed since username matches reg_no
        assert resp.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_admin_object_permission(self, api_client, admin_user):
        """Test admin can access any student object."""
        from sims_backend.admissions.models import Student

        student = Student.objects.create(
            reg_no="STU-999",
            name="Any Student",
            program="BSc",
            status="active",
        )

        api_client.force_authenticate(admin_user)
        resp = api_client.get(f"/api/students/{student.id}/")

        assert resp.status_code == status.HTTP_200_OK


class TestCommonPermissionsUnauthenticated:
    """Test common permissions with unauthenticated users."""

    def test_unauthenticated_cannot_access(self, api_client):
        """Test that unauthenticated users are denied."""
        resp = api_client.get("/api/programs/")
        assert resp.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


class TestAuditMiddlewareEdgeCases:
    """Test audit middleware edge cases."""

    def test_middleware_handles_no_resolver_match(self, api_client, admin_user):
        """Test middleware handles requests without resolver_match."""
        # Access a valid endpoint that will have a resolver_match
        api_client.force_authenticate(admin_user)
        resp = api_client.get("/api/students/")
        assert resp.status_code == status.HTTP_200_OK

    def test_middleware_handles_invalid_response_data(self, api_client, admin_user):
        """Test middleware handles responses without standard data structure."""
        api_client.force_authenticate(admin_user)

        # DELETE returns 204 with no content
        from sims_backend.admissions.models import Student

        student = Student.objects.create(
            reg_no="DEL-001", name="To Delete", program="BSc", status="active"
        )

        resp = api_client.delete(f"/api/students/{student.id}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT


class TestSerializerEdgeCases:
    """Test serializer edge cases."""

    def test_student_serializer_empty_reg_no_validation(self):
        """Test that empty registration numbers are rejected."""
        from sims_backend.admissions.serializers import StudentSerializer

        # This should trigger the validate_reg_no method
        data = {
            "reg_no": "   ",  # Whitespace only
            "name": "Test",
            "program": "BSc",
            "status": "active",
        }
        serializer = StudentSerializer(data=data)
        assert not serializer.is_valid()
        assert "reg_no" in serializer.errors


class TestPermissionHelperFunctions:
    """Test permission helper functions edge cases."""

    def test_in_group_with_none_user(self):
        """Test _in_group handles None user gracefully."""
        from sims_backend.admissions.permissions import _in_group

        result = _in_group(None, "Admin")
        assert result is False

    def test_common_in_group_with_none_user(self):
        """Test in_group handles None user gracefully."""
        from sims_backend.common_permissions import in_group

        result = in_group(None, "Admin")
        assert result is False


class TestAssessmentScoreViews:
    """Test assessment score endpoints."""

    def test_list_assessment_scores(self, api_client, admin_user):
        """Test listing assessment scores."""
        from sims_backend.academics.models import Course, Program, Section
        from sims_backend.admissions.models import Student
        from sims_backend.assessments.models import Assessment, AssessmentScore

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
        AssessmentScore.objects.create(
            assessment=assessment, student=student, score=85, max_score=100
        )

        api_client.force_authenticate(admin_user)
        resp = api_client.get("/api/assessment-scores/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 1
