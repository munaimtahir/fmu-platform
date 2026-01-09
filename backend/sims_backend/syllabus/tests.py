"""Tests for syllabus endpoints."""
import pytest
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, LearningBlock, Module, Period, Program, Track
from sims_backend.syllabus.models import SyllabusItem


@pytest.mark.django_db
class TestSyllabusItem:
    """Test syllabus item CRUD and filtering."""

    def test_non_admin_gets_403(self, api_client):
        """Non-admin users should get 403."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(username="regular", password="pass")
        api_client.force_authenticate(user=user)
        
        response = api_client.get("/api/admin/syllabus/")
        assert response.status_code == 403

    def test_admin_can_list_syllabus_items(self, api_client, admin_user):
        """Admin can list syllabus items."""
        api_client.force_authenticate(user=admin_user)
        
        # Create test data
        program = Program.objects.create(name="Test Program", is_active=True)
        period = Period.objects.create(program=program, name="Year 1", order=1)
        track = Track.objects.create(program=program, name="Track A")
        block = LearningBlock.objects.create(
            period=period,
            track=track,
            name="Block 1",
            block_type=LearningBlock.BLOCK_TYPE_INTEGRATED,
            start_date="2024-01-01",
            end_date="2024-03-31",
        )
        
        item = SyllabusItem.objects.create(
            program=program,
            title="Test Syllabus",
            order_no=1,
        )
        
        response = api_client.get("/api/admin/syllabus/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) >= 1
        assert any(i["id"] == item.id for i in data["results"])

    def test_admin_can_create_syllabus_item(self, api_client, admin_user):
        """Admin can create syllabus items."""
        api_client.force_authenticate(user=admin_user)
        
        program = Program.objects.create(name="Test Program", is_active=True)
        
        data = {
            "program": program.id,
            "title": "New Syllabus Item",
            "description": "Test description",
            "learning_objectives": "Learn X, Y, Z",
            "order_no": 1,
            "is_active": True,
        }
        
        response = api_client.post("/api/admin/syllabus/", data, format="json")
        assert response.status_code == 201
        assert response.json()["title"] == "New Syllabus Item"

    def test_admin_can_filter_by_program(self, api_client, admin_user):
        """Admin can filter syllabus items by program."""
        api_client.force_authenticate(user=admin_user)
        
        program1 = Program.objects.create(name="Program 1", is_active=True)
        program2 = Program.objects.create(name="Program 2", is_active=True)
        
        SyllabusItem.objects.create(program=program1, title="Item 1", order_no=1)
        SyllabusItem.objects.create(program=program2, title="Item 2", order_no=1)
        
        response = api_client.get("/api/admin/syllabus/", {"program_id": program1.id})
        assert response.status_code == 200
        data = response.json()
        assert all(item["program"] == program1.id for item in data["results"])

    def test_admin_can_reorder_items(self, api_client, admin_user):
        """Admin can bulk reorder syllabus items."""
        api_client.force_authenticate(user=admin_user)
        
        program = Program.objects.create(name="Test Program", is_active=True)
        item1 = SyllabusItem.objects.create(program=program, title="Item 1", order_no=1)
        item2 = SyllabusItem.objects.create(program=program, title="Item 2", order_no=2)
        
        data = {
            "items": [
                {"id": item1.id, "order_no": 2},
                {"id": item2.id, "order_no": 1},
            ]
        }
        
        response = api_client.post("/api/admin/syllabus/reorder/", data, format="json")
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify reorder
        item1.refresh_from_db()
        item2.refresh_from_db()
        assert item1.order_no == 2
        assert item2.order_no == 1

    def test_validation_requires_at_least_one_anchor(self, api_client, admin_user):
        """Syllabus item must have at least one academic anchor."""
        api_client.force_authenticate(user=admin_user)
        
        data = {
            "title": "Invalid Item",
            "order_no": 1,
        }
        
        response = api_client.post("/api/admin/syllabus/", data, format="json")
        assert response.status_code == 400
        assert "anchor" in str(response.json()).lower()
