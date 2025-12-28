"""Comprehensive permission tests for all modules."""

import pytest
from rest_framework import status

from sims_backend.academics.models import Program
from sims_backend.admissions.models import Student

pytestmark = pytest.mark.django_db


class TestStudentPermissions:
    """Test student-specific permission logic."""

    def test_student_cannot_create_student(self, api_client, student_user):
        """Students should not be able to create new students."""
        api_client.force_authenticate(student_user)
        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "NEW-001",
                "name": "New Student",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )
        assert resp.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ]

    def test_student_cannot_update_other_student(self, api_client, student_user):
        """Students should not be able to update other students."""
        other_student = Student.objects.create(
            reg_no="STU-9999", name="Other", program="BSc", status="active"
        )
        api_client.force_authenticate(student_user)
        resp = api_client.patch(
            f"/api/students/{other_student.id}/",
            {"name": "Hacked Name"},
            format="json",
        )
        assert resp.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_student_cannot_delete_student(self, api_client, student_user):
        """Students should not be able to delete students."""
        own_student = Student.objects.create(
            reg_no="STU-0001", name="Own", program="BSc", status="active"
        )
        api_client.force_authenticate(student_user)
        resp = api_client.delete(f"/api/students/{own_student.id}/")
        assert resp.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ]


class TestRegistrarPermissions:
    """Test registrar permission logic."""

    def test_registrar_can_create_student(self, api_client, registrar_user):
        """Registrars should be able to create students."""
        api_client.force_authenticate(registrar_user)
        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "REG-001",
                "name": "New Student",
                "program": "BSc",
                "status": "active",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

    def test_registrar_can_update_student(self, api_client, registrar_user):
        """Registrars should be able to update students."""
        student = Student.objects.create(
            reg_no="STU-001", name="Test", program="BSc", status="active"
        )
        api_client.force_authenticate(registrar_user)
        resp = api_client.patch(
            f"/api/students/{student.id}/",
            {"name": "Updated Name"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        student.refresh_from_db()
        assert student.name == "Updated Name"

    def test_registrar_can_list_all_students(self, api_client, registrar_user):
        """Registrars should see all students."""
        Student.objects.create(
            reg_no="STU-001", name="Student1", program="BSc", status="active"
        )
        Student.objects.create(
            reg_no="STU-002", name="Student2", program="MSc", status="active"
        )
        api_client.force_authenticate(registrar_user)
        resp = api_client.get("/api/students/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["results"]) >= 2


class TestAdminPermissions:
    """Test admin permission logic."""

    def test_admin_can_crud_students(self, api_client, admin_user):
        """Admins should have full CRUD access."""
        api_client.force_authenticate(admin_user)

        # Create
        resp = api_client.post(
            "/api/students/",
            {
                "reg_no": "ADM-001",
                "name": "Admin Created",
                "program": "PhD",
                "status": "active",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        student_id = resp.json()["id"]

        # Read
        resp = api_client.get(f"/api/students/{student_id}/")
        assert resp.status_code == status.HTTP_200_OK

        # Update
        resp = api_client.patch(
            f"/api/students/{student_id}/",
            {"status": "graduated"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

        # Delete
        resp = api_client.delete(f"/api/students/{student_id}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT


class TestCommonPermissions:
    """Test common permission classes."""

    def test_unauthenticated_cannot_access_students(self, api_client):
        """Unauthenticated users should be denied."""
        resp = api_client.get("/api/students/")
        assert resp.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_authenticated_can_read_programs(self, api_client, student_user):
        """All authenticated users should be able to read programs."""
        Program.objects.create(name="BSc Computer Science")
        api_client.force_authenticate(student_user)
        resp = api_client.get("/api/programs/")
        assert resp.status_code == status.HTTP_200_OK

    def test_student_cannot_create_program(self, api_client, student_user):
        """Students should not be able to create programs."""
        api_client.force_authenticate(student_user)
        resp = api_client.post(
            "/api/programs/",
            {"name": "New Program"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
