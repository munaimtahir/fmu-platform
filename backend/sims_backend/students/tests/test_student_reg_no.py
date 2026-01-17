"""
Tests for Student API (reg_no persistence)
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Group, Program
from sims_backend.students.models import Student


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123'
    )
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
def academic_structure(db):
    """Create academic structure for tests"""
    program = Program.objects.create(name="MBBS", description="Bachelor of Medicine")
    batch = Batch.objects.create(name="2024 Batch", program=program, start_year=2024)
    group = Group.objects.create(name="Group A", batch=batch)
    return {"program": program, "batch": batch, "group": group}


@pytest.mark.django_db
class TestStudentRegNoField:
    """Tests for student reg_no field persistence"""

    def test_create_student_with_reg_no(self, api_client, academic_structure):
        """Student can be created with reg_no"""
        data = {
            "reg_no": "2024-MBBS-001",
            "name": "John Doe",
            "program": academic_structure["program"].id,
            "batch": academic_structure["batch"].id,
            "group": academic_structure["group"].id,
            "status": "active",
        }
        response = api_client.post('/api/students/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['reg_no'] == "2024-MBBS-001"
        
        # Verify in database
        student = Student.objects.get(reg_no="2024-MBBS-001")
        assert student.name == "John Doe"
        assert student.reg_no == "2024-MBBS-001"

    def test_update_student_preserves_reg_no(self, api_client, academic_structure):
        """Updating student preserves reg_no"""
        # Create student
        student = Student.objects.create(
            reg_no="2024-MBBS-002",
            name="Jane Doe",
            program=academic_structure["program"],
            batch=academic_structure["batch"],
            group=academic_structure["group"],
            status="active"
        )
        
        # Update student (change name, not reg_no)
        update_data = {
            "name": "Jane Smith",
        }
        response = api_client.patch(f'/api/students/{student.id}/', update_data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reg_no'] == "2024-MBBS-002"
        assert response.data['name'] == "Jane Smith"
        
        # Verify in database
        student.refresh_from_db()
        assert student.reg_no == "2024-MBBS-002"
        assert student.name == "Jane Smith"

    def test_retrieve_student_returns_reg_no(self, api_client, academic_structure):
        """Retrieving student returns reg_no"""
        student = Student.objects.create(
            reg_no="2024-MBBS-003",
            name="Bob Smith",
            program=academic_structure["program"],
            batch=academic_structure["batch"],
            group=academic_structure["group"],
            status="active"
        )
        
        response = api_client.get(f'/api/students/{student.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reg_no'] == "2024-MBBS-003"
        assert 'reg_no' in response.data

    def test_list_students_includes_reg_no(self, api_client, academic_structure):
        """Listing students includes reg_no"""
        Student.objects.create(
            reg_no="2024-MBBS-004",
            name="Alice Johnson",
            program=academic_structure["program"],
            batch=academic_structure["batch"],
            group=academic_structure["group"],
            status="active"
        )
        
        response = api_client.get('/api/students/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) > 0
        
        student_data = next((s for s in response.data['results'] if s['reg_no'] == "2024-MBBS-004"), None)
        assert student_data is not None
        assert student_data['reg_no'] == "2024-MBBS-004"

    def test_reg_no_uniqueness(self, api_client, academic_structure):
        """reg_no must be unique"""
        # Create first student
        Student.objects.create(
            reg_no="2024-MBBS-UNIQUE",
            name="Student One",
            program=academic_structure["program"],
            batch=academic_structure["batch"],
            group=academic_structure["group"],
            status="active"
        )
        
        # Try to create second student with same reg_no
        data = {
            "reg_no": "2024-MBBS-UNIQUE",
            "name": "Student Two",
            "program": academic_structure["program"].id,
            "batch": academic_structure["batch"].id,
            "group": academic_structure["group"].id,
            "status": "active",
        }
        response = api_client.post('/api/students/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'reg_no' in str(response.data).lower() or 'unique' in str(response.data).lower()
