"""Tests for audit middleware edge cases and exception handling."""

import pytest
from django.contrib.auth.models import User
from rest_framework import status

from sims_backend.admissions.models import Student
from sims_backend.audit.models import AuditLog

pytestmark = pytest.mark.django_db


class TestAuditMiddleware:
    """Test audit logging middleware."""

    def test_audit_log_on_create(self, api_client, admin_user):
        """Test that audit logs are created on POST."""
        api_client.force_authenticate(admin_user)
        initial_count = AuditLog.objects.count()

        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "AUDIT-001",
                "name": "Test Student",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert AuditLog.objects.count() == initial_count + 1

        log = AuditLog.objects.latest("timestamp")
        assert log.method == "POST"
        assert log.actor == admin_user
        assert log.status_code == 201

    def test_audit_log_on_update(self, api_client, admin_user):
        """Test that audit logs are created on PATCH/PUT."""
        student = Student.objects.create(
            reg_no="AUDIT-002", name="Original", program="BSc", status="active"
        )
        api_client.force_authenticate(admin_user)
        initial_count = AuditLog.objects.count()

        resp = api_client.patch(
            f"/api/students/{student.id}/",
            {"name": "Updated Name"},
            format="json",
        )

        assert resp.status_code == status.HTTP_200_OK
        assert AuditLog.objects.count() == initial_count + 1

        log = AuditLog.objects.latest("timestamp")
        assert log.method in ["PATCH", "PUT"]
        assert log.actor == admin_user

    def test_audit_log_on_delete(self, api_client, admin_user):
        """Test that audit logs are created on DELETE."""
        student = Student.objects.create(
            reg_no="AUDIT-003", name="To Delete", program="BSc", status="active"
        )
        api_client.force_authenticate(admin_user)
        initial_count = AuditLog.objects.count()

        resp = api_client.delete(f"/api/students/{student.id}/")

        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert AuditLog.objects.count() == initial_count + 1

        log = AuditLog.objects.latest("timestamp")
        assert log.method == "DELETE"
        assert log.actor == admin_user

    def test_no_audit_log_on_read(self, api_client, admin_user):
        """Test that audit logs are NOT created on GET."""
        Student.objects.create(
            reg_no="AUDIT-004", name="Read Only", program="BSc", status="active"
        )
        api_client.force_authenticate(admin_user)
        initial_count = AuditLog.objects.count()

        resp = api_client.get("/api/students/")

        assert resp.status_code == status.HTTP_200_OK
        assert AuditLog.objects.count() == initial_count

    def test_no_audit_log_on_failed_request(self, api_client, student_user):
        """Test that audit logs are NOT created on failed requests."""
        initial_count = AuditLog.objects.count()
        api_client.force_authenticate(student_user)

        # Student attempting to create (should fail)
        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "FAIL-001",
                "name": "Should Fail",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )

        assert resp.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ]
        # No audit log should be created for failed requests
        assert AuditLog.objects.count() == initial_count

    def test_audit_log_captures_object_id(self, api_client, admin_user):
        """Test that audit logs capture the object ID."""
        api_client.force_authenticate(admin_user)

        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "AUDIT-005",
                "name": "With ID",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED
        student_id = resp.json()["id"]

        log = AuditLog.objects.latest("timestamp")
        assert log.object_id == str(student_id)

    def test_audit_log_summary_format(self, api_client, admin_user):
        """Test audit log summary format."""
        api_client.force_authenticate(admin_user)

        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "AUDIT-006",
                "name": "Summary Test",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED

        log = AuditLog.objects.latest("timestamp")
        assert "POST" in log.summary
        assert log.object_id in log.summary or log.model in log.summary


class TestPermissionEdgeCases:
    """Test permission edge cases."""

    def test_unauthenticated_user_denied(self, api_client):
        """Test that unauthenticated users are denied."""
        resp = api_client.get("/api/students/")
        assert resp.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_user_without_groups_denied_write(self, api_client):
        """Test that users without groups cannot write."""
        user = User.objects.create_user(username="nogroups", password="pass")
        api_client.force_authenticate(user)

        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "NOGR-001",
                "name": "No Groups",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )

        assert resp.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ]

    def test_faculty_can_read_programs(self, api_client):
        """Test that faculty users can read (SAFE_METHODS)."""
        from django.contrib.auth.models import Group

        user = User.objects.create_user(username="faculty1", password="pass")
        faculty_group, _ = Group.objects.get_or_create(name="Faculty")
        user.groups.add(faculty_group)
        api_client.force_authenticate(user)

        resp = api_client.get("/api/programs/")
        assert resp.status_code == status.HTTP_200_OK

    def test_in_group_exception_handling(self):
        """Test that _in_group handles exceptions gracefully."""
        from sims_backend.admissions.permissions import _in_group

        # User without groups attribute
        class FakeUser:
            pass

        result = _in_group(FakeUser(), "Admin")
        assert result is False

    def test_common_permissions_in_group_exception_handling(self):
        """Test that common in_group handles exceptions gracefully."""
        from sims_backend.common_permissions import in_group

        # User without groups attribute
        class FakeUser:
            pass

        result = in_group(FakeUser(), "Admin")
        assert result is False
