"""Tests for core/views.py to achieve >98% coverage."""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program, Section
from sims_backend.admissions.models import Student
from sims_backend.attendance.models import Attendance
from sims_backend.enrollment.models import Enrollment

User = get_user_model()


@pytest.mark.django_db
def test_dashboard_stats_student_without_record():
    """Test dashboard for student user without a corresponding Student record.

    This covers lines 92-94: the Student.DoesNotExist exception handling.
    """
    # Create a student user that has no matching Student record
    student_user = User.objects.create_user(
        username="orphan-student",
        email="orphan@test.com",
        password="test123",
        first_name="Orphan",
        last_name="Student",
    )
    student_group, _ = Group.objects.get_or_create(name="Student")
    student_user.groups.add(student_group)

    client = APIClient()
    client.force_authenticate(user=student_user)

    response = client.get("/api/dashboard/stats/")
    assert response.status_code == 200
    assert "error" in response.data
    assert response.data["error"] == "No student record found for this user"


@pytest.mark.django_db
def test_dashboard_stats_user_without_role():
    """Test dashboard for user with no specific role.

    This covers lines 95-96: the else branch for users not in any role group.
    """
    # Create a user without any group assignment
    plain_user = User.objects.create_user(
        username="plain-user", email="plain@test.com", password="test123"
    )

    client = APIClient()
    client.force_authenticate(user=plain_user)

    response = client.get("/api/dashboard/stats/")
    assert response.status_code == 200
    assert "message" in response.data
    assert response.data["message"] == "No statistics available for your role"


@pytest.mark.django_db
def test_calculate_attendance_rate_with_data():
    """Test _calculate_attendance_rate with actual attendance records.

    This covers lines 158-159: the return statement with present attendance.
    """
    # Setup
    program = Program.objects.create(name="Test Program")
    course = Course.objects.create(
        code="TEST101", title="Test Course", credits=3, program=program
    )
    section = Section.objects.create(
        course=course, term="Fall-25", teacher_name="Dr. Test"
    )
    student = Student.objects.create(
        reg_no="S001", name="Test Student", program="Test Program", status="active"
    )

    # Create enrollment
    Enrollment.objects.create(student=student, section=section)

    # Create attendance records: 3 present, 1 absent
    from datetime import date, timedelta

    today = date.today()
    Attendance.objects.create(
        student=student, section=section, date=today, present=True
    )
    Attendance.objects.create(
        student=student, section=section, date=today - timedelta(days=1), present=True
    )
    Attendance.objects.create(
        student=student, section=section, date=today - timedelta(days=2), present=True
    )
    Attendance.objects.create(
        student=student, section=section, date=today - timedelta(days=3), present=False
    )

    # Import the helper function
    from core.views import _calculate_attendance_rate

    rate = _calculate_attendance_rate(student)
    assert rate == 75.0  # 3 out of 4 = 75%


@pytest.mark.django_db
def test_count_pending_attendance_with_list():
    """Test _count_pending_attendance when sections is a list/non-queryset.

    This covers lines 136-137: the branch that converts a list to queryset.
    """
    # Setup
    program = Program.objects.create(name="Test Program")
    course1 = Course.objects.create(
        code="TEST101", title="Test Course 1", credits=3, program=program
    )
    course2 = Course.objects.create(
        code="TEST102", title="Test Course 2", credits=3, program=program
    )
    section1 = Section.objects.create(
        course=course1, term="Fall-25", teacher_name="Dr. Test"
    )
    section2 = Section.objects.create(
        course=course2, term="Fall-25", teacher_name="Dr. Test"
    )

    # Create student and enrollment
    student = Student.objects.create(
        reg_no="S002", name="Test Student", program="Test Program", status="active"
    )
    Enrollment.objects.create(student=student, section=section1)

    # Add old attendance to section1 (more than 7 days ago)
    from datetime import date, timedelta

    old_date = date.today() - timedelta(days=10)
    Attendance.objects.create(
        student=student, section=section1, date=old_date, present=True
    )

    # Import the helper function
    from core.views import _count_pending_attendance

    # Pass sections as a list (not a queryset)
    sections_list = [section1, section2]
    count = _count_pending_attendance(sections_list)

    # Both sections should have no attendance in last 7 days
    assert count == 2
