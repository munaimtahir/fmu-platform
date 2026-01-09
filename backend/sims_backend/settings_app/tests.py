"""Tests for settings endpoints."""
import pytest
from rest_framework.test import APIClient

from sims_backend.settings_app.models import AppSetting


@pytest.mark.django_db
class TestAppSetting:
    """Test app settings CRUD and validation."""

    def test_non_admin_gets_403(self, api_client):
        """Non-admin users should get 403."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(username="regular", password="pass")
        api_client.force_authenticate(user=user)
        
        response = api_client.get("/api/admin/settings/")
        assert response.status_code == 403

    def test_admin_can_list_settings(self, api_client, admin_user):
        """Admin can list settings."""
        api_client.force_authenticate(user=admin_user)
        
        AppSetting.set_value("enable_student_portal", True, admin_user)
        
        response = api_client.get("/api/admin/settings/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) >= 1

    def test_admin_can_create_setting(self, api_client, admin_user):
        """Admin can create a new setting."""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            "key": "enable_student_portal",
            "value_json": True,
            "value_type": "boolean",
        }
        
        response = api_client.post("/api/admin/settings/", data, format="json")
        assert response.status_code == 201
        assert response.json()["value_json"] is True

    def test_admin_can_update_setting(self, api_client, admin_user):
        """Admin can update an existing setting."""
        api_client.force_authenticate(user=admin_user)
        
        setting = AppSetting.set_value("enable_student_portal", True, admin_user)
        
        data = {
            "value_json": False,
            "value_type": "boolean",
        }
        
        response = api_client.patch(
            f"/api/admin/settings/{setting.key}/", data, format="json"
        )
        assert response.status_code == 200
        assert response.json()["value_json"] is False

    def test_invalid_key_rejected(self, api_client, admin_user):
        """Invalid keys are rejected."""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            "key": "invalid_key",
            "value_json": "test",
            "value_type": "string",
        }
        
        response = api_client.post("/api/admin/settings/", data, format="json")
        assert response.status_code == 400
        assert "allowlist" in str(response.json()).lower()

    def test_invalid_value_rejected(self, api_client, admin_user):
        """Invalid values are rejected."""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            "key": "attendance_lock_days",
            "value_json": 500,  # > 365
            "value_type": "integer",
        }
        
        response = api_client.post("/api/admin/settings/", data, format="json")
        assert response.status_code == 400

    def test_get_allowed_keys(self, api_client, admin_user):
        """Admin can get list of allowed keys."""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.get("/api/admin/settings/allowed_keys/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "key" in data[0]
        assert "type" in data[0]
