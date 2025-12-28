"""Tests to ensure fixtures and conftest work correctly."""

import pytest
from django.contrib.auth.models import Group, User

pytestmark = pytest.mark.django_db


def test_ensure_roles_fixture():
    """Test that ensure_roles fixture creates required groups."""
    assert Group.objects.filter(name="Admin").exists()
    assert Group.objects.filter(name="Registrar").exists()
    assert Group.objects.filter(name="Student").exists()


def test_api_client_fixture(api_client):
    """Test that api_client fixture works."""
    assert api_client is not None
    resp = api_client.get("/api/students/")
    assert resp.status_code in [401, 403]  # Should be unauthorized


def test_admin_user_fixture(admin_user):
    """Test that admin_user fixture creates a superuser."""
    assert admin_user.is_superuser
    assert admin_user.is_staff
    assert admin_user.username == "admin1"


def test_registrar_user_fixture(registrar_user):
    """Test that registrar_user fixture creates a registrar."""
    assert registrar_user.is_staff
    assert registrar_user.username == "registrar1"
    assert registrar_user.groups.filter(name="Registrar").exists()


def test_student_user_fixture(student_user):
    """Test that student_user fixture creates a student."""
    assert not student_user.is_staff
    assert student_user.username == "STU-0001"
    assert student_user.groups.filter(name="Student").exists()


def test_faculty_user_creation(db):
    """Test creating a faculty user for completeness."""
    faculty_group, _ = Group.objects.get_or_create(name="Faculty")
    user = User.objects.create_user(username="faculty1", password="pass")
    user.groups.add(faculty_group)
    assert user.groups.filter(name="Faculty").exists()


def test_exam_cell_user_creation(db):
    """Test creating an exam cell user for completeness."""
    exam_group, _ = Group.objects.get_or_create(name="ExamCell")
    user = User.objects.create_user(username="exam1", password="pass")
    user.groups.add(exam_group)
    assert user.groups.filter(name="ExamCell").exists()
