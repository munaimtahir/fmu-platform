"""Tests for Request Tickets module"""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from sims_backend.admissions.models import Student
from sims_backend.requests.models import Request


@pytest.fixture
def api_client():
    client = APIClient()
    user = User.objects.create_user(
        username="testuser", password="testpass", is_staff=True, is_superuser=True
    )
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def sample_student():
    return Student.objects.create(
        reg_no="2024001", name="John Doe", program="CS", status="active"
    )


@pytest.mark.django_db
class TestRequestCRUD:
    def test_create_request(self, api_client, sample_student):
        """Test creating a new request"""
        response = api_client.post(
            "/api/requests/",
            {
                "student": sample_student.id,
                "type": "transcript",
                "notes": "Need transcript for job application",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["type"] == "transcript"
        assert response.data["status"] == "pending"
        assert response.data["student"] == sample_student.id

    def test_list_requests(self, api_client, sample_student):
        """Test listing requests"""
        Request.objects.create(
            student=sample_student, type="transcript", notes="Test request 1"
        )
        Request.objects.create(
            student=sample_student, type="bonafide", notes="Test request 2"
        )

        response = api_client.get("/api/requests/")

        assert response.status_code == 200
        assert len(response.data["results"]) == 2

    def test_get_request_detail(self, api_client, sample_student):
        """Test getting request details"""
        request = Request.objects.create(
            student=sample_student, type="transcript", notes="Test request"
        )

        response = api_client.get(f"/api/requests/{request.id}/")

        assert response.status_code == 200
        assert response.data["id"] == request.id
        assert response.data["type"] == "transcript"

    def test_update_request(self, api_client, sample_student):
        """Test updating a request"""
        request = Request.objects.create(
            student=sample_student, type="transcript", notes="Old notes"
        )

        response = api_client.patch(
            f"/api/requests/{request.id}/",
            {"notes": "Updated notes"},
            format="json",
        )

        assert response.status_code == 200
        request.refresh_from_db()
        assert request.notes == "Updated notes"

    def test_delete_request(self, api_client, sample_student):
        """Test deleting a request"""
        request = Request.objects.create(
            student=sample_student, type="transcript", notes="Test request"
        )

        response = api_client.delete(f"/api/requests/{request.id}/")

        assert response.status_code == 204
        assert not Request.objects.filter(id=request.id).exists()


@pytest.mark.django_db
class TestRequestTransition:
    def test_transition_to_approved(self, api_client, sample_student):
        """Test transitioning request to approved"""
        request = Request.objects.create(
            student=sample_student, type="transcript", status="pending"
        )

        response = api_client.post(
            f"/api/requests/{request.id}/transition/",
            {
                "status": "approved",
                "processed_by": "registrar@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        request.refresh_from_db()
        assert request.status == "approved"
        assert request.processed_by == "registrar@university.edu"

    def test_transition_to_rejected(self, api_client, sample_student):
        """Test transitioning request to rejected"""
        request = Request.objects.create(
            student=sample_student, type="bonafide", status="pending"
        )

        response = api_client.post(
            f"/api/requests/{request.id}/transition/",
            {
                "status": "rejected",
                "processed_by": "registrar@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        request.refresh_from_db()
        assert request.status == "rejected"

    def test_transition_to_completed(self, api_client, sample_student):
        """Test transitioning request to completed"""
        request = Request.objects.create(
            student=sample_student, type="transcript", status="approved"
        )

        response = api_client.post(
            f"/api/requests/{request.id}/transition/",
            {
                "status": "completed",
                "processed_by": "registrar@university.edu",
            },
            format="json",
        )

        assert response.status_code == 200
        request.refresh_from_db()
        assert request.status == "completed"

    def test_transition_missing_status(self, api_client, sample_student):
        """Test transition without status"""
        request = Request.objects.create(
            student=sample_student, type="transcript", status="pending"
        )

        response = api_client.post(
            f"/api/requests/{request.id}/transition/",
            {"processed_by": "registrar@university.edu"},
            format="json",
        )

        assert response.status_code == 400
        assert "required" in response.data["error"]["message"].lower()

    def test_transition_invalid_status(self, api_client, sample_student):
        """Test transition with invalid status"""
        request = Request.objects.create(
            student=sample_student, type="transcript", status="pending"
        )

        response = api_client.post(
            f"/api/requests/{request.id}/transition/",
            {"status": "invalid_status"},
            format="json",
        )

        assert response.status_code == 400
        assert "invalid" in response.data["error"]["message"].lower()


@pytest.mark.django_db
class TestRequestTypes:
    def test_create_transcript_request(self, api_client, sample_student):
        """Test creating transcript request"""
        response = api_client.post(
            "/api/requests/",
            {"student": sample_student.id, "type": "transcript"},
            format="json",
        )

        assert response.status_code == 201
        assert response.data["type"] == "transcript"

    def test_create_bonafide_request(self, api_client, sample_student):
        """Test creating bonafide certificate request"""
        response = api_client.post(
            "/api/requests/",
            {"student": sample_student.id, "type": "bonafide"},
            format="json",
        )

        assert response.status_code == 201
        assert response.data["type"] == "bonafide"

    def test_create_noc_request(self, api_client, sample_student):
        """Test creating NOC request"""
        response = api_client.post(
            "/api/requests/",
            {"student": sample_student.id, "type": "noc"},
            format="json",
        )

        assert response.status_code == 201
        assert response.data["type"] == "noc"

    def test_create_other_request(self, api_client, sample_student):
        """Test creating other type request"""
        response = api_client.post(
            "/api/requests/",
            {
                "student": sample_student.id,
                "type": "other",
                "notes": "Custom request type",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["type"] == "other"


@pytest.mark.django_db
class TestRequestSearch:
    def test_search_by_reg_no(self, api_client, sample_student):
        """Test searching requests by student reg_no"""
        Request.objects.create(student=sample_student, type="transcript")

        response = api_client.get("/api/requests/", {"search": sample_student.reg_no})

        assert response.status_code == 200
        assert len(response.data["results"]) == 1

    def test_search_by_type(self, api_client, sample_student):
        """Test searching requests by type"""
        Request.objects.create(student=sample_student, type="transcript")
        Request.objects.create(student=sample_student, type="bonafide")

        response = api_client.get("/api/requests/", {"search": "transcript"})

        assert response.status_code == 200
        assert len(response.data["results"]) >= 1

    def test_search_by_status(self, api_client, sample_student):
        """Test searching requests by status"""
        Request.objects.create(
            student=sample_student, type="transcript", status="pending"
        )
        Request.objects.create(
            student=sample_student, type="bonafide", status="approved"
        )

        response = api_client.get("/api/requests/", {"search": "approved"})

        assert response.status_code == 200
        assert all(
            result["status"] == "approved"
            or "approved" in result.get("notes", "").lower()
            for result in response.data["results"]
        )


@pytest.mark.django_db
class TestRequestOrdering:
    def test_ordering_by_created_at(self, api_client, sample_student):
        """Test ordering requests by creation date"""
        Request.objects.create(student=sample_student, type="transcript")
        Request.objects.create(student=sample_student, type="bonafide")

        response = api_client.get("/api/requests/", {"ordering": "-created_at"})

        assert response.status_code == 200
        # Should be ordered by most recent first (default)
        results = response.data["results"]
        if len(results) >= 2:
            assert results[0]["id"] > results[1]["id"]  # Newer IDs first

    def test_ordering_by_updated_at(self, api_client, sample_student):
        """Test ordering requests by update date"""
        Request.objects.create(student=sample_student, type="transcript")

        response = api_client.get("/api/requests/", {"ordering": "updated_at"})

        assert response.status_code == 200
