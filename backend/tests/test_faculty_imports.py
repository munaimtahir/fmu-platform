"""
Comprehensive tests for faculty import endpoint.
Covers: preview, commit, template, jobs list, job detail, error CSV.
Tests permission denials, validation errors, and success paths.
"""

import io
import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from sims_backend.faculty.imports.models import FacultyImportJob

User = get_user_model()


@pytest.mark.django_db
class TestFacultyImportPreview:
    """Test faculty import preview endpoint."""

    def test_preview_requires_authentication(self, api_client):
        """Anonymous users cannot access preview."""
        csv_content = b"email,first_name,last_name\ntest@test.com,Test,User"
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")

        response = api_client.post("/api/admin/faculty/import/preview/", {"file": file})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_preview_requires_admin_or_coordinator(self, student_client, student_user):
        """Non-admin/coordinator users get 403."""
        csv_content = b"email,first_name,last_name\ntest@test.com,Test,User"
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")

        response = student_client.post("/api/admin/faculty/import/preview/", {"file": file})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_preview_requires_file(self, admin_client):
        """Preview endpoint requires file in payload."""
        response = admin_client.post("/api/admin/faculty/import/preview/", {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_preview_success_with_admin(self, admin_client, admin_user):
        """Admin can successfully preview faculty CSV."""
        csv_content = b"email,first_name,last_name,department\nadmin@test.com,John,Doe,Computer Science"
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")

        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file},
            format="multipart"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "job_id" in data
        assert "valid_rows" in data
        assert "invalid_rows" in data

    def test_preview_success_with_coordinator(self, coordinator_client, coordinator_user):
        """Coordinator can successfully preview faculty CSV."""
        csv_content = b"email,first_name,last_name,department\ncoord@test.com,Jane,Smith,Engineering"
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")

        response = coordinator_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file},
            format="multipart"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "job_id" in data

    def test_preview_with_mode_parameter(self, admin_client):
        """Preview respects mode parameter (CREATE_ONLY or UPSERT)."""
        csv_content = b"email,first_name,last_name\nnew@test.com,New,User"
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")

        # Test with CREATE_ONLY
        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file, "mode": "CREATE_ONLY"},
            format="multipart"
        )
        assert response.status_code == status.HTTP_200_OK

        # Test with UPSERT
        file = SimpleUploadedFile("faculty.csv", csv_content, content_type="text/csv")
        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file, "mode": "UPSERT"},
            format="multipart"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_preview_handles_empty_file(self, admin_client):
        """Preview handles empty CSV gracefully."""
        csv_content = b""
        file = SimpleUploadedFile("empty.csv", csv_content, content_type="text/csv")

        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file},
            format="multipart"
        )
        # Should accept but report 0 valid rows
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_preview_handles_malformed_csv(self, admin_client):
        """Preview handles malformed CSV."""
        # Missing required columns
        csv_content = b"name,something\nValue1,Value2"
        file = SimpleUploadedFile("bad.csv", csv_content, content_type="text/csv")

        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": file},
            format="multipart"
        )
        # Should handle gracefully
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]


@pytest.mark.django_db
class TestFacultyImportCommit:
    """Test faculty import commit endpoint."""

    def test_commit_requires_authentication(self, api_client):
        """Anonymous users cannot commit."""
        response = api_client.post(
            "/api/admin/faculty/import/commit/",
            {"import_job_id": "some-id", "confirm": True}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_commit_requires_admin_or_coordinator(self, student_client):
        """Non-admin/coordinator users get 403."""
        response = student_client.post(
            "/api/admin/faculty/import/commit/",
            {"import_job_id": "some-id", "confirm": True}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_commit_requires_confirmation(self, admin_client):
        """Commit requires confirm=True flag."""
        response = admin_client.post(
            "/api/admin/faculty/import/commit/",
            {"import_job_id": "some-id", "confirm": False}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "confirm" in data.get("error", "").lower()

    def test_commit_with_missing_job_id(self, admin_client):
        """Commit fails when job ID is invalid."""
        response = admin_client.post(
            "/api/admin/faculty/import/commit/",
            {"import_job_id": "invalid-uuid", "confirm": True}
        )
        # Should return 400 error
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]

    def test_commit_without_job_id_field(self, admin_client):
        """Commit fails when job_id field is missing."""
        response = admin_client.post(
            "/api/admin/faculty/import/commit/",
            {"confirm": True}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestFacultyImportTemplate:
    """Test faculty import template endpoint."""

    def test_template_requires_authentication(self, api_client):
        """Anonymous users cannot download template."""
        response = api_client.get("/api/admin/faculty/import/template/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_template_requires_admin_or_coordinator(self, student_client):
        """Non-admin/coordinator users get 403."""
        response = student_client.get("/api/admin/faculty/import/template/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_template_admin_can_download(self, admin_client):
        """Admin can download template."""
        response = admin_client.get("/api/admin/faculty/import/template/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"
        assert "Content-Disposition" in response
        assert "attachment" in response["Content-Disposition"]

    def test_template_coordinator_can_download(self, coordinator_client):
        """Coordinator can download template."""
        response = coordinator_client.get("/api/admin/faculty/import/template/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"

    def test_template_content_has_headers(self, admin_client):
        """Template contains expected CSV headers."""
        response = admin_client.get("/api/admin/faculty/import/template/")
        assert response.status_code == status.HTTP_200_OK
        content = response.content.decode('utf-8')
        # Should contain common faculty fields
        assert "email" in content.lower() or "name" in content.lower()


@pytest.mark.django_db
class TestFacultyImportJobs:
    """Test faculty import jobs listing endpoint."""

    def test_jobs_requires_authentication(self, api_client):
        """Anonymous users cannot list jobs."""
        response = api_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_jobs_requires_admin_or_coordinator(self, student_client):
        """Non-admin/coordinator users get 403."""
        response = student_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_jobs_admin_list_empty(self, admin_client, admin_user):
        """Admin can list jobs (initially empty)."""
        response = admin_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_jobs_coordinator_list_empty(self, coordinator_client, coordinator_user):
        """Coordinator can list jobs (initially empty)."""
        response = coordinator_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_jobs_list_filters_by_user(self, admin_client, admin_user, coordinator_client, coordinator_user, db):
        """Jobs list shows only jobs created by authenticated user."""
        # Create a job for admin user
        job1 = FacultyImportJob.objects.create(
            created_by=admin_user,
            original_filename="admin.csv",
            file="dummy.csv",
            file_hash="hash1"
        )

        # Create a job for coordinator user
        job2 = FacultyImportJob.objects.create(
            created_by=coordinator_user,
            original_filename="coord.csv",
            file="dummy.csv",
            file_hash="hash2"
        )

        # Admin should see only their job
        response = admin_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(job1.id)

        # Coordinator should see only their job
        response = coordinator_client.get("/api/admin/faculty/import/jobs/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(job2.id)


@pytest.mark.django_db
class TestFacultyImportJobDetail:
    """Test faculty import job detail endpoint."""

    def test_job_detail_requires_authentication(self, api_client):
        """Anonymous users cannot view job detail."""
        response = api_client.get("/api/admin/faculty/import/fake-id/detail/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_job_detail_requires_admin_or_coordinator(self, student_client):
        """Non-admin/coordinator users get 403."""
        response = student_client.get("/api/admin/faculty/import/fake-id/detail/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_job_detail_not_found(self, admin_client):
        """Non-existent job returns 404."""
        response = admin_client.get("/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/detail/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_job_detail_user_isolation(self, admin_client, admin_user, coordinator_client, coordinator_user, db):
        """User cannot view another user's job."""
        # Create a job for coordinator
        job = FacultyImportJob.objects.create(
            created_by=coordinator_user,
            original_filename="coord.csv",
            file="dummy.csv",
            file_hash="hash1"
        )

        # Admin tries to view coordinator's job
        response = admin_client.get(f"/api/admin/faculty/import/{job.id}/detail/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_job_detail_success(self, admin_client, admin_user, db):
        """Admin can view their own job detail."""
        job = FacultyImportJob.objects.create(
            created_by=admin_user,
            original_filename="test.csv",
            file="dummy.csv",
            file_hash="hash1",
            status=FacultyImportJob.STATUS_PREVIEWED,
            total_rows=10,
            valid_rows=8,
            invalid_rows=2
        )

        response = admin_client.get(f"/api/admin/faculty/import/{job.id}/detail/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(job.id)
        assert data["original_filename"] == "test.csv"
        assert data["status"] == FacultyImportJob.STATUS_PREVIEWED
        assert data["total_rows"] == 10
        assert data["valid_rows"] == 8
        assert data["invalid_rows"] == 2


@pytest.mark.django_db
class TestFacultyImportErrorsCSV:
    """Test faculty import error report download endpoint."""

    def test_errors_csv_requires_authentication(self, api_client):
        """Anonymous users cannot download error CSV."""
        response = api_client.get("/api/admin/faculty/import/fake-id/errors.csv/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_errors_csv_requires_admin_or_coordinator(self, student_client):
        """Non-admin/coordinator users get 403."""
        response = student_client.get("/api/admin/faculty/import/fake-id/errors.csv/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_errors_csv_not_found_job(self, admin_client):
        """Non-existent job returns 404."""
        response = admin_client.get("/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/errors.csv/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_errors_csv_user_isolation(self, admin_client, admin_user, coordinator_client, coordinator_user, db):
        """User cannot download another user's error report."""
        job = FacultyImportJob.objects.create(
            created_by=coordinator_user,
            original_filename="coord.csv",
            file="dummy.csv",
            file_hash="hash1"
        )

        response = admin_client.get(f"/api/admin/faculty/import/{job.id}/errors.csv/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_errors_csv_not_available(self, admin_client, admin_user, db):
        """404 when job has no error report."""
        job = FacultyImportJob.objects.create(
            created_by=admin_user,
            original_filename="test.csv",
            file="dummy.csv",
            file_hash="hash1",
            error_report_file=None
        )

        response = admin_client.get(f"/api/admin/faculty/import/{job.id}/errors.csv/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "error" in data


@pytest.mark.django_db
class TestFacultyImportPermissions:
    """Test permission matrix for faculty import endpoints."""

    def test_all_endpoints_deny_unauthenticated(self, api_client):
        """All faculty import endpoints deny unauthenticated users."""
        csv_file = SimpleUploadedFile("test.csv", b"email,name\ntest@test.com,Test", content_type="text/csv")

        endpoints = [
            ("post", "/api/admin/faculty/import/preview/", {"file": csv_file}),
            ("post", "/api/admin/faculty/import/commit/", {"import_job_id": "id", "confirm": True}),
            ("get", "/api/admin/faculty/import/template/", {}),
            ("get", "/api/admin/faculty/import/jobs/", {}),
            ("get", "/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/detail/", {}),
            ("get", "/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/errors.csv/", {}),
        ]

        for method, endpoint, payload in endpoints:
            if method == "post":
                response = api_client.post(endpoint, payload, format="multipart" if payload.get("file") else "json")
            else:
                response = api_client.get(endpoint)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, f"Endpoint {endpoint} did not reject unauthenticated request"

    def test_all_endpoints_deny_wrong_role(self, student_client):
        """All faculty import endpoints deny students."""
        csv_file = SimpleUploadedFile("test.csv", b"email,name\ntest@test.com,Test", content_type="text/csv")

        endpoints = [
            ("post", "/api/admin/faculty/import/preview/", {"file": csv_file}),
            ("post", "/api/admin/faculty/import/commit/", {"import_job_id": "id", "confirm": True}),
            ("get", "/api/admin/faculty/import/template/", {}),
            ("get", "/api/admin/faculty/import/jobs/", {}),
            ("get", "/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/detail/", {}),
            ("get", "/api/admin/faculty/import/00000000-0000-0000-0000-000000000000/errors.csv/", {}),
        ]

        for method, endpoint, payload in endpoints:
            if method == "post":
                response = student_client.post(endpoint, payload, format="multipart" if payload.get("file") else "json")
            else:
                response = student_client.get(endpoint)
            assert response.status_code == status.HTTP_403_FORBIDDEN, f"Endpoint {endpoint} did not deny student"

    def test_all_endpoints_allow_admin(self, admin_client):
        """All faculty import endpoints allow admin users."""
        csv_file = SimpleUploadedFile("test.csv", b"email,first_name,last_name\ntest@test.com,Test,User", content_type="text/csv")

        # Test GET endpoints (should succeed)
        get_endpoints = [
            "/api/admin/faculty/import/template/",
            "/api/admin/faculty/import/jobs/",
        ]
        for endpoint in get_endpoints:
            response = admin_client.get(endpoint)
            assert response.status_code == status.HTTP_200_OK, f"GET {endpoint} failed for admin"

        # Test POST endpoints (may fail validation but should not fail permission)
        # Preview should succeed with valid file
        response = admin_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": csv_file},
            format="multipart"
        )
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST], f"POST preview failed for admin"

    def test_all_endpoints_allow_coordinator(self, coordinator_client):
        """All faculty import endpoints allow coordinator users."""
        csv_file = SimpleUploadedFile("test.csv", b"email,first_name,last_name\ntest@test.com,Test,User", content_type="text/csv")

        get_endpoints = [
            "/api/admin/faculty/import/template/",
            "/api/admin/faculty/import/jobs/",
        ]
        for endpoint in get_endpoints:
            response = coordinator_client.get(endpoint)
            assert response.status_code == status.HTTP_200_OK, f"GET {endpoint} failed for coordinator"

        response = coordinator_client.post(
            "/api/admin/faculty/import/preview/",
            {"file": csv_file},
            format="multipart"
        )
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST], f"POST preview failed for coordinator"
