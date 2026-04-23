import pytest
from rest_framework import status
from django.contrib.auth.models import Group, User
from sims_backend.audit.models import AuditLog

@pytest.fixture
def impersonation_setup(db):
    admin_user = User.objects.create_superuser(username="admin_imp", password="pass")
    admin_group, _ = Group.objects.get_or_create(name="ADMIN")
    admin_user.groups.add(admin_group)
    
    target_user = User.objects.create_user(username="target_user", password="pass")
    student_group, _ = Group.objects.get_or_create(name="STUDENT")
    target_user.groups.add(student_group)
    
    return {
        "admin": admin_user,
        "target": target_user
    }

@pytest.mark.django_db
class TestImpersonationViews:
    def test_start_impersonation_success(self, api_client, impersonation_setup):
        api_client.force_authenticate(user=impersonation_setup["admin"])
        url = "/api/admin/impersonation/start/"
        data = {"target_user_id": impersonation_setup["target"].id}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == 200
        assert "access" in response.data
        assert response.data["target"]["username"] == "target_user"
        assert AuditLog.objects.filter(action=AuditLog.ACTION_SPECIAL).exists()

    def test_start_impersonation_deny_self(self, api_client, impersonation_setup):
        api_client.force_authenticate(user=impersonation_setup["admin"])
        url = "/api/admin/impersonation/start/"
        data = {"target_user_id": impersonation_setup["admin"].id}
        response = api_client.post(url, data, format="json")
        
        # Cannot impersonate other admins (including self)
        assert response.status_code == 403

    def test_stop_impersonation(self, api_client, impersonation_setup):
        api_client.force_authenticate(user=impersonation_setup["admin"])
        url = "/api/admin/impersonation/stop/"
        data = {"target_user_id": impersonation_setup["target"].id}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == 200
        assert response.data["success"] is True
        assert AuditLog.objects.filter(summary__contains="Stopped impersonating").exists()
