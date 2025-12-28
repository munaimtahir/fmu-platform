"""
Tests for role-based permissions and data filtering
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program, Section, Term
from sims_backend.admissions.models import Student
from sims_backend.enrollment.models import Enrollment

User = get_user_model()


@pytest.fixture
def setup_data(db):
    """Set up test data with users, roles, and sections"""
    # Get or create groups
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    faculty_group, _ = Group.objects.get_or_create(name="Faculty")
    student_group, _ = Group.objects.get_or_create(name="Student")
    registrar_group, _ = Group.objects.get_or_create(name="Registrar")

    # Create users
    admin = User.objects.create_user(
        username="admin_test",
        email="admin@test.com",
        password="password123",
        first_name="Admin",
        last_name="User",
    )
    admin.groups.add(admin_group)

    faculty1 = User.objects.create_user(
        username="faculty1_test",
        email="faculty1@test.com",
        password="password123",
        first_name="John",
        last_name="Faculty",
    )
    faculty1.groups.add(faculty_group)

    faculty2 = User.objects.create_user(
        username="faculty2_test",
        email="faculty2@test.com",
        password="password123",
        first_name="Jane",
        last_name="Professor",
    )
    faculty2.groups.add(faculty_group)

    student_user = User.objects.create_user(
        username="student_test",
        email="student@test.com",
        password="password123",
        first_name="Test",
        last_name="Student",
    )
    student_user.groups.add(student_group)

    registrar = User.objects.create_user(
        username="registrar_test",
        email="registrar@test.com",
        password="password123",
        first_name="Mary",
        last_name="Registrar",
    )
    registrar.groups.add(registrar_group)

    # Create academic data
    program = Program.objects.create(name="Computer Science")
    course1 = Course.objects.create(
        code="CS101", title="Intro to CS", credits=3, program=program
    )
    course2 = Course.objects.create(
        code="CS201", title="Data Structures", credits=3, program=program
    )

    term = Term.objects.create(
        name="Fall 2024",
        status="open",
        start_date="2024-09-01",
        end_date="2024-12-31",
    )

    # Create sections - faculty1 teaches section1, faculty2 teaches section2
    section1 = Section.objects.create(
        course=course1, term=term.name, teacher=faculty1, capacity=30
    )
    section2 = Section.objects.create(
        course=course2, term=term.name, teacher=faculty2, capacity=30
    )

    # Create student
    student = Student.objects.create(
        reg_no="2024-CS-001",
        name=f"{student_user.first_name} {student_user.last_name}",
        program=program.name,
        status="active",
    )

    # Enroll student
    enrollment = Enrollment.objects.create(
        student=student, section=section1, term=term.name, status="enrolled"
    )

    return {
        "admin": admin,
        "faculty1": faculty1,
        "faculty2": faculty2,
        "student_user": student_user,
        "registrar": registrar,
        "section1": section1,
        "section2": section2,
        "student": student,
        "enrollment": enrollment,
    }


@pytest.mark.django_db
class TestAdminPermissions:
    """Test admin has full access to all resources"""

    def test_admin_can_view_all_sections(self, setup_data):
        """Admin should see all sections"""
        client = APIClient()
        client.force_authenticate(user=setup_data["admin"])

        response = client.get("/api/sections/")
        assert response.status_code == 200
        # Should see both sections
        assert len(response.data["results"]) == 2

    def test_admin_can_view_dashboard_stats(self, setup_data):
        """Admin should get comprehensive dashboard stats"""
        client = APIClient()
        client.force_authenticate(user=setup_data["admin"])

        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "total_students" in response.data
        assert "total_courses" in response.data
        assert "active_sections" in response.data
        assert response.data["total_students"] == 1
        assert response.data["active_sections"] == 2


@pytest.mark.django_db
class TestFacultyPermissions:
    """Test faculty only sees their own sections and students"""

    def test_faculty_sees_only_own_sections(self, setup_data):
        """Faculty should only see sections they teach"""
        client = APIClient()
        client.force_authenticate(user=setup_data["faculty1"])

        response = client.get("/api/sections/")
        assert response.status_code == 200
        # faculty1 should only see section1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == setup_data["section1"].id

    def test_other_faculty_sees_different_sections(self, setup_data):
        """Different faculty sees different sections"""
        client = APIClient()
        client.force_authenticate(user=setup_data["faculty2"])

        response = client.get("/api/sections/")
        assert response.status_code == 200
        # faculty2 should only see section2
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == setup_data["section2"].id

    def test_faculty_dashboard_stats(self, setup_data):
        """Faculty should get personalized dashboard stats"""
        client = APIClient()
        client.force_authenticate(user=setup_data["faculty1"])

        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "my_sections" in response.data
        assert "my_students" in response.data
        assert response.data["my_sections"] == 1

    def test_faculty_read_only_for_students(self, setup_data):
        """Faculty cannot access student list (only admin/registrar can)"""
        client = APIClient()
        client.force_authenticate(user=setup_data["faculty1"])

        # Faculty should be denied access to student list
        response = client.get("/api/students/")
        # Faculty don't have permission to view student list
        assert response.status_code == 403


@pytest.mark.django_db
class TestStudentPermissions:
    """Test student can only view their own data"""

    def test_student_can_view_own_enrollments(self, setup_data):
        """Student should see their own enrollments"""
        client = APIClient()
        client.force_authenticate(user=setup_data["student_user"])

        response = client.get("/api/enrollments/")
        assert response.status_code == 200
        # Student should see their enrollment

    def test_student_dashboard_stats(self, setup_data):
        """Student should get personalized dashboard stats"""
        client = APIClient()
        client.force_authenticate(user=setup_data["student_user"])

        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "enrolled_courses" in response.data
        assert "attendance_rate" in response.data
        # Should have at least 1 enrollment
        assert response.data["enrolled_courses"] >= 1

    def test_student_read_only_access(self, setup_data):
        """Student should have read-only access to most resources"""
        client = APIClient()
        client.force_authenticate(user=setup_data["student_user"])

        # Can read sections
        response = client.get("/api/sections/")
        assert response.status_code == 200


@pytest.mark.django_db
class TestRegistrarPermissions:
    """Test registrar has elevated permissions"""

    def test_registrar_can_view_all_sections(self, setup_data):
        """Registrar should see all sections"""
        client = APIClient()
        client.force_authenticate(user=setup_data["registrar"])

        response = client.get("/api/sections/")
        assert response.status_code == 200
        # Should see both sections
        assert len(response.data["results"]) == 2

    def test_registrar_dashboard_stats(self, setup_data):
        """Registrar should get comprehensive dashboard stats"""
        client = APIClient()
        client.force_authenticate(user=setup_data["registrar"])

        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "total_students" in response.data
        assert "total_courses" in response.data


@pytest.mark.django_db
class TestUnauthenticatedAccess:
    """Test unauthenticated users are denied access"""

    def test_unauthenticated_cannot_access_sections(self):
        """Unauthenticated users should be denied"""
        client = APIClient()

        response = client.get("/api/sections/")
        assert response.status_code == 401

    def test_unauthenticated_cannot_access_dashboard(self):
        """Unauthenticated users should be denied dashboard"""
        client = APIClient()

        response = client.get("/api/dashboard/stats/")
        assert response.status_code == 401
