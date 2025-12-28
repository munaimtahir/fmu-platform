import pytest
from django.test import override_settings

from sims_backend.audit.models import AuditLog


@pytest.mark.django_db
@override_settings(ROOT_URLCONF="sims_backend.admissions.urls")
def test_successful_write_is_logged(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    payload = {
        "reg_no": "STU-1001",
        "name": "Test Student",
        "program": "BSc Computer Science",
        "status": "active",
    }

    response = api_client.post("/api/students/", payload, format="json")

    assert response.status_code == 201
    log = AuditLog.objects.get()
    assert log.actor == admin_user
    assert log.method == "POST"
    assert log.path == "/api/students/"
    assert log.object_id == str(response.data["id"])
    assert "admissions.Student" in log.model
    assert log.summary.startswith("POST")


@pytest.mark.django_db
@override_settings(ROOT_URLCONF="sims_backend.admissions.urls")
def test_failed_write_does_not_emit_audit_log(api_client, admin_user):
    api_client.force_authenticate(admin_user)

    response = api_client.post(
        "/api/students/",
        {"name": "Missing Reg"},
        format="json",
    )

    assert response.status_code == 400
    assert AuditLog.objects.count() == 0
