"""Tests for admin control plane endpoints."""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Group as AcademicGroup, Program
from sims_backend.audit.models import AuditLog
from sims_backend.students.models import Student

User = get_user_model()


@pytest.mark.django_db
class TestAdminDashboard:
    """Test admin dashboard endpoint."""

    def test_non_admin_gets_403(self, api_client):
        """Non-admin users should get 403."""
        # Create a regular user (not admin)
        user = User.objects.create_user(username="regular", password="pass")
        api_client.force_authenticate(user=user)
        
        response = api_client.get("/api/admin/dashboard/")
        assert response.status_code == 403

    def test_admin_gets_dashboard_data(self, api_client, admin_user):
        """Admin should get dashboard data with correct keys."""
        api_client.force_authenticate(user=admin_user)
        
        # Create some test data
        program = Program.objects.create(name="Test Program", is_active=True)
        batch = Batch.objects.create(program=program, name="2024", start_year=2024)
        group = AcademicGroup.objects.create(batch=batch, name="A")
        student = Student.objects.create(
            reg_no="ST001",
            name="Test Student",
            program=program,
            batch=batch,
            group=group,
        )
        
        # Create faculty user
        faculty_user = User.objects.create_user(username="faculty1", password="pass")
        faculty_group, _ = Group.objects.get_or_create(name="FACULTY")
        faculty_user.groups.add(faculty_group)
        
        # Create audit log entry
        AuditLog.objects.create(
            actor=admin_user,
            method="POST",
            path="/api/test/",
            status_code=201,
            action=AuditLog.ACTION_CREATE,
            summary="Test action",
        )
        
        response = api_client.get("/api/admin/dashboard/")
        assert response.status_code == 200
        
        data = response.json()
        assert "counts" in data
        assert "attendance_stats" in data
        assert "recent_activity" in data
        assert "system" in data
        
        assert data["counts"]["students"] == 1
        assert data["counts"]["faculty"] == 1
        assert data["counts"]["programs"] == 1
        assert "last_7_days" in data["attendance_stats"]
        assert isinstance(data["recent_activity"], list)
        assert "app_version" in data["system"]
        assert "server_time" in data["system"]


@pytest.mark.django_db
class TestAdminUsers:
    """Test admin user management endpoints."""

    def test_non_admin_gets_403(self, api_client):
        """Non-admin users should get 403."""
        user = User.objects.create_user(username="regular", password="pass")
        api_client.force_authenticate(user=user)
        
        response = api_client.get("/api/admin/users/")
        assert response.status_code == 403

    def test_admin_can_list_users(self, api_client, admin_user):
        """Admin can list users."""
        api_client.force_authenticate(user=admin_user)
        
        User.objects.create_user(username="testuser", password="pass")
        
        response = api_client.get("/api/admin/users/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) >= 2  # admin_user + testuser

    def test_admin_can_create_user(self, api_client, admin_user):
        """Admin can create a new user."""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "first_name": "New",
            "last_name": "User",
            "password": "temp123",
            "is_active": True,
            "role": "FACULTY",
        }
        
        response = api_client.post("/api/admin/users/", data, format="json")
        assert response.status_code == 201
        assert response.json()["username"] == "newuser"
        
        # Verify audit log
        audit = AuditLog.objects.filter(
            actor=admin_user,
            action=AuditLog.ACTION_CREATE,
            entity="User",
        ).first()
        assert audit is not None

    def test_admin_can_update_user(self, api_client, admin_user):
        """Admin can update a user."""
        api_client.force_authenticate(user=admin_user)
        
        user = User.objects.create_user(username="testuser", password="pass")
        
        data = {
            "first_name": "Updated",
            "last_name": "Name",
            "is_active": True,
        }
        
        response = api_client.patch(f"/api/admin/users/{user.id}/", data, format="json")
        assert response.status_code == 200
        assert response.json()["first_name"] == "Updated"

    def test_admin_can_reset_password(self, api_client, admin_user):
        """Admin can reset user password."""
        api_client.force_authenticate(user=admin_user)
        
        user = User.objects.create_user(username="testuser", password="oldpass")
        
        response = api_client.post(f"/api/admin/users/{user.id}/reset-password/")
        assert response.status_code == 200
        assert "temporary_password" in response.json()
        
        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password(response.json()["temporary_password"])

    def test_admin_can_activate_deactivate(self, api_client, admin_user):
        """Admin can activate/deactivate users."""
        api_client.force_authenticate(user=admin_user)
        
        user = User.objects.create_user(username="testuser", password="pass", is_active=False)
        
        # Activate
        response = api_client.post(f"/api/admin/users/{user.id}/activate/")
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.is_active is True
        
        # Deactivate
        response = api_client.post(f"/api/admin/users/{user.id}/deactivate/")
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.is_active is False

    def test_cannot_deactivate_last_admin(self, api_client, admin_user):
        """Cannot deactivate the last admin user."""
        api_client.force_authenticate(user=admin_user)
        
        # Try to deactivate the only admin
        response = api_client.post(f"/api/admin/users/{admin_user.id}/deactivate/")
        assert response.status_code == 400
        assert "last admin" in response.json()["error"].lower()

    def test_admin_can_filter_by_role(self, api_client, admin_user):
        """Admin can filter users by role."""
        api_client.force_authenticate(user=admin_user)
        
        faculty_user = User.objects.create_user(username="faculty1", password="pass")
        faculty_group, _ = Group.objects.get_or_create(name="FACULTY")
        faculty_user.groups.add(faculty_group)
        
        response = api_client.get("/api/admin/users/", {"role": "FACULTY"})
        assert response.status_code == 200
        data = response.json()
        assert all("FACULTY" in user.get("groups_list", []) for user in data["results"])
