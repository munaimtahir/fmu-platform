import pytest
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.test import APIClient

@pytest.fixture
def admin_client(db):
    admin = User.objects.create_superuser(username="admin_rep", password="pass")
    client = APIClient()
    client.force_authenticate(user=admin)
    return client

@pytest.mark.django_db
class TestReportingEdgeCases:
    def test_finance_collection_empty(self, admin_client):
        response = admin_client.get("/api/finance/reports/collection/?start=2000-01-01&end=2000-01-01")
        assert response.status_code == 200
        assert response.data["total_collected"] == 0
        assert response.data["total_count"] == 0

    def test_finance_aging_empty(self, admin_client):
        response = admin_client.get("/api/finance/reports/aging/")
        assert response.status_code == 200
        assert "buckets" in response.data

    def test_attendance_eligibility_invalid_student(self, admin_client):
        response = admin_client.get("/api/attendance/eligibility/?student_id=999&section_id=999")
        assert response.status_code == 200 # Implementation returns 0.0 percentage
        assert response.data["attendance_percentage"] == 0.0

    def test_results_exam_not_found(self, admin_client):
        response = admin_client.get("/api/results/exams/999/")
        assert response.status_code == 200 # DRF might return empty list for invalid ID if filtered
        assert len(response.data) == 0

    def test_admin_audit_filter_empty(self, admin_client):
        response = admin_client.get("/api/audit/?action=LOGIN")
        assert response.status_code == 200
        # If no audit logs, should be empty paginated list
        if "results" in response.data:
            assert len(response.data["results"]) == 0
        else:
            assert len(response.data) == 0
