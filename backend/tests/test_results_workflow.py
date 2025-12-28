"""Tests for results publish/freeze workflow and pending changes"""

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.results.models import PendingChange, Result


@pytest.fixture
def api_client():
    client = APIClient()
    user = User.objects.create_user(
        username="testuser", password="testpass", is_staff=True, is_superuser=True
    )
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_data():
    """Create sample data for testing"""
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
    result = Result.objects.create(student=student, section=section, final_grade="B+")
    return {
        "program": program,
        "course": course,
        "section": section,
        "student": student,
        "result": result,
    }


@pytest.mark.django_db
class TestResultPublish:
    def test_publish_result_success(self, api_client, sample_data):
        """Test successful result publishing"""
        result = sample_data["result"]
        assert not result.is_published
        assert result.published_at is None

        response = api_client.post(
            "/api/results/publish/",
            {
                "result_id": result.id,
                "published_by": "registrar@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        result.refresh_from_db()
        assert result.is_published
        assert result.published_at is not None
        assert result.published_by == "registrar@university.edu"

    def test_publish_result_missing_id(self, api_client):
        """Test publishing without result_id"""
        response = api_client.post(
            "/api/results/publish/",
            {"published_by": "registrar@university.edu"},
            format="json",
        )

        assert response.status_code == 400
        assert "result_id is required" in response.data["error"]["message"]

    def test_publish_result_not_found(self, api_client):
        """Test publishing non-existent result"""
        response = api_client.post(
            "/api/results/publish/",
            {"result_id": 99999, "published_by": "registrar@university.edu"},
            format="json",
        )

        assert response.status_code == 404
        assert "Result not found" in response.data["error"]["message"]

    def test_publish_already_published_result(self, api_client, sample_data):
        """Test publishing already published result"""
        result = sample_data["result"]
        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = "registrar@university.edu"
        result.save()

        response = api_client.post(
            "/api/results/publish/",
            {"result_id": result.id, "published_by": "registrar@university.edu"},
            format="json",
        )

        assert response.status_code == 400
        assert "already published" in response.data["error"]["message"]


@pytest.mark.django_db
class TestResultImmutability:
    def test_cannot_update_published_result(self, api_client, sample_data):
        """Test that published results cannot be directly updated"""
        result = sample_data["result"]
        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = "registrar@university.edu"
        result.save()

        response = api_client.put(
            f"/api/results/{result.id}/",
            {"final_grade": "A"},
            format="json",
        )

        assert response.status_code == 403
        assert "change-request" in response.data["error"]["message"]

    def test_cannot_patch_published_result(self, api_client, sample_data):
        """Test that published results cannot be partially updated"""
        result = sample_data["result"]
        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = "registrar@university.edu"
        result.save()

        response = api_client.patch(
            f"/api/results/{result.id}/",
            {"final_grade": "A"},
            format="json",
        )

        assert response.status_code == 403
        assert "change-request" in response.data["error"]["message"]

    def test_can_update_unpublished_result(self, api_client, sample_data):
        """Test that unpublished results can be updated"""
        result = sample_data["result"]
        assert not result.is_published

        response = api_client.patch(
            f"/api/results/{result.id}/",
            {"final_grade": "A"},
            format="json",
        )

        assert response.status_code == 200
        result.refresh_from_db()
        assert result.final_grade == "A"


@pytest.mark.django_db
class TestChangeRequest:
    def test_create_change_request_success(self, api_client, sample_data):
        """Test creating a change request for published result"""
        result = sample_data["result"]
        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = "registrar@university.edu"
        result.save()

        response = api_client.post(
            "/api/results/change-request/",
            {
                "result_id": result.id,
                "new_grade": "A",
                "requested_by": "faculty@university.edu",
                "reason": "Grade calculation error",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["new_grade"] == "A"
        assert response.data["status"] == "pending"
        assert response.data["requested_by"] == "faculty@university.edu"

    def test_create_change_request_missing_fields(self, api_client, sample_data):
        """Test creating change request without required fields"""
        result = sample_data["result"]
        result.is_published = True
        result.save()

        response = api_client.post(
            "/api/results/change-request/",
            {"result_id": result.id},
            format="json",
        )

        assert response.status_code == 400
        assert "required" in response.data["error"]["message"]

    def test_create_change_request_unpublished_result(self, api_client, sample_data):
        """Test creating change request for unpublished result"""
        result = sample_data["result"]
        assert not result.is_published

        response = api_client.post(
            "/api/results/change-request/",
            {
                "result_id": result.id,
                "new_grade": "A",
                "requested_by": "faculty@university.edu",
            },
            format="json",
        )

        assert response.status_code == 400
        assert "published results" in response.data["error"]["message"]


@pytest.mark.django_db
class TestApproveChange:
    def test_approve_change_request(self, api_client, sample_data):
        """Test approving a change request"""
        result = sample_data["result"]
        result.is_published = True
        result.published_at = timezone.now()
        result.published_by = "registrar@university.edu"
        result.final_grade = "B+"
        result.save()

        pending_change = PendingChange.objects.create(
            result=result,
            new_grade="A",
            requested_by="faculty@university.edu",
            reason="Grade calculation error",
        )

        response = api_client.post(
            "/api/results/approve-change/",
            {
                "change_id": pending_change.id,
                "approved": True,
                "approved_by": "examcell@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        assert "approved and applied" in response.data["message"]

        result.refresh_from_db()
        assert result.final_grade == "A"

        pending_change.refresh_from_db()
        assert pending_change.status == "approved"
        assert pending_change.approved_by == "examcell@university.edu"
        assert pending_change.resolved_at is not None

    def test_reject_change_request(self, api_client, sample_data):
        """Test rejecting a change request"""
        result = sample_data["result"]
        result.is_published = True
        result.save()

        pending_change = PendingChange.objects.create(
            result=result,
            new_grade="A",
            requested_by="faculty@university.edu",
        )

        original_grade = result.final_grade

        response = api_client.post(
            "/api/results/approve-change/",
            {
                "change_id": pending_change.id,
                "approved": False,
                "approved_by": "examcell@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        assert "rejected" in response.data["message"]

        result.refresh_from_db()
        assert result.final_grade == original_grade  # Grade unchanged

        pending_change.refresh_from_db()
        assert pending_change.status == "rejected"
        assert pending_change.approved_by == "examcell@university.edu"

    def test_approve_already_resolved_change(self, api_client, sample_data):
        """Test approving already resolved change request"""
        result = sample_data["result"]
        result.is_published = True
        result.save()

        pending_change = PendingChange.objects.create(
            result=result,
            new_grade="A",
            requested_by="faculty@university.edu",
            status="approved",
            approved_by="examcell@university.edu",
            resolved_at=timezone.now(),
        )

        response = api_client.post(
            "/api/results/approve-change/",
            {
                "change_id": pending_change.id,
                "approved": True,
                "approved_by": "examcell@university.edu",
            },
            format="json",
        )

        assert response.status_code == 400
        assert "already approved" in response.data["error"]["message"]

    def test_approve_nonexistent_change(self, api_client):
        """Test approving nonexistent change request"""
        response = api_client.post(
            "/api/results/approve-change/",
            {"change_id": 99999, "approved": True},
            format="json",
        )

        assert response.status_code == 404
        assert "not found" in response.data["error"]["message"]
