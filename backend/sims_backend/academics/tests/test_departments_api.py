"""
Tests for Department API endpoints (create, delete)
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import Department


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123'
    )
    # Add admin permissions (simplified - in real app would use groups/permissions)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


@pytest.fixture
def api_client(admin_user):
    """Create API client with admin authentication"""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def department(db):
    """Create a test department"""
    return Department.objects.create(
        name="Medicine",
        code="MED",
        description="Department of Medicine"
    )


@pytest.mark.django_db
class TestDepartmentCreate:
    """Tests for department creation"""

    def test_create_department_success(self, api_client):
        """Admin can create a department"""
        data = {
            "name": "Surgery",
            "code": "SURG",
            "description": "Department of Surgery"
        }
        response = api_client.post('/api/academics/departments/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == "Surgery"
        assert response.data['code'] == "SURG"
        assert Department.objects.filter(name="Surgery").exists()

    def test_create_department_without_code(self, api_client):
        """Department can be created without code"""
        data = {
            "name": "Anatomy",
            "description": "Department of Anatomy"
        }
        response = api_client.post('/api/academics/departments/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == "Anatomy"
        assert response.data['code'] == "" or response.data['code'] is None

    def test_create_department_with_parent(self, api_client, department):
        """Department can be created with parent"""
        data = {
            "name": "Cardiology",
            "code": "CARD",
            "parent": department.id
        }
        response = api_client.post('/api/academics/departments/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['parent'] == department.id
        assert response.data['parent_name'] == department.name

    def test_create_department_duplicate_name_fails(self, api_client, department):
        """Cannot create department with duplicate name (same parent)"""
        data = {
            "name": department.name,  # Same name
            "code": "MED2"
        }
        response = api_client.post('/api/academics/departments/', data, format='json')
        # Should fail due to unique constraint
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR]


@pytest.mark.django_db
class TestDepartmentDelete:
    """Tests for department deletion"""

    def test_delete_department_success(self, api_client, department):
        """Admin can delete a department"""
        dept_id = department.id
        response = api_client.delete(f'/api/academics/departments/{dept_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Department.objects.filter(id=dept_id).exists()

    def test_delete_department_with_children(self, api_client, department):
        """Can delete department even if it has children (CASCADE)"""
        child = Department.objects.create(
            name="Sub Department",
            code="SUB",
            parent=department
        )
        dept_id = department.id
        response = api_client.delete(f'/api/academics/departments/{dept_id}/')
        # With CASCADE, parent deletion should succeed and child should be deleted too
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Department.objects.filter(id=dept_id).exists()
        # Child should also be deleted due to CASCADE
        assert not Department.objects.filter(id=child.id).exists()

    def test_delete_nonexistent_department(self, api_client):
        """Deleting nonexistent department returns 404"""
        response = api_client.delete('/api/academics/departments/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_non_admin_cannot_delete(self, db):
        """Non-admin user cannot delete department"""
        user = User.objects.create_user(
            username='regular',
            email='regular@test.com',
            password='testpass123'
        )
        department = Department.objects.create(name="Test Dept", code="TEST")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f'/api/academics/departments/{department.id}/')
        # Should fail due to permissions
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]
