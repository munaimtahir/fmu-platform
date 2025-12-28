import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import Course, Program

User = get_user_model()


@pytest.mark.django_db
def test_course_filter_by_program_name():
    """
    Test that courses can be filtered by program name.
    """
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="password")
    client.force_authenticate(user=user)
    program = Program.objects.create(name="Computer Science")
    course = Course.objects.create(
        code="CS101", title="Introduction to Computer Science", program=program
    )
    # Create another course in a different program to ensure we are filtering
    other_program = Program.objects.create(name="Mathematics")
    Course.objects.create(
        code="MATH101", title="Calculus I", program=other_program
    )

    # Filter by program name
    url = reverse("course-list")
    response = client.get(url, {"program": "Computer Science"})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["code"] == course.code
