from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, User
from django.utils import timezone
from rest_framework import status

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group as AcadGroup, Program, Section
from sims_backend.learning.models import LearningMaterial
from sims_backend.students.models import Student


@pytest.fixture
def learning_context(db):
    program = Program.objects.create(name="MBBS", description="Program")
    batch = Batch.objects.create(name="Batch 2024", program=program, start_year=2024)
    group = AcadGroup.objects.create(name="Group A", batch=batch)
    term = AcademicPeriod.objects.create(name="Year 1", period_type=AcademicPeriod.PERIOD_TYPE_YEAR)
    department = Department.objects.create(name="Anatomy", code="ANAT")
    course = Course.objects.create(
        code="ANAT-101",
        name="Anatomy",
        department=department,
        academic_period=term,
    )

    faculty_user = User.objects.create_user(username="faculty1", password="pass")
    faculty_user.groups.add(Group.objects.get(name="FACULTY"))

    other_faculty = User.objects.create_user(username="faculty2", password="pass")
    other_faculty.groups.add(Group.objects.get(name="FACULTY"))

    student_user = User.objects.create_user(username="student1", password="pass")
    student_user.groups.add(Group.objects.get(name="STUDENT"))
    student = Student.objects.create(
        user=student_user,
        reg_no="REG-001",
        name="Student One",
        program=program,
        batch=batch,
        group=group,
    )

    section = Section.objects.create(
        course=course,
        academic_period=term,
        faculty=faculty_user,
        group=group,
        name="Section A",
    )

    return {
        "program": program,
        "batch": batch,
        "group": group,
        "term": term,
        "department": department,
        "course": course,
        "section": section,
        "faculty_user": faculty_user,
        "other_faculty": other_faculty,
        "student_user": student_user,
        "student": student,
    }


@pytest.mark.django_db
def test_student_cannot_create_publish_archive(api_client, learning_context):
    student_user = learning_context["student_user"]

    api_client.force_authenticate(user=student_user)
    response = api_client.post(
        "/api/learning/materials/",
        {
            "title": "Link",
            "kind": LearningMaterial.KIND_LINK,
            "url": "https://example.com",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

    material = LearningMaterial.objects.create(
        title="Draft",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com",
        created_by=learning_context["faculty_user"],
    )

    publish_response = api_client.post(f"/api/learning/materials/{material.id}/publish/")
    archive_response = api_client.post(f"/api/learning/materials/{material.id}/archive/")

    assert publish_response.status_code == status.HTTP_403_FORBIDDEN
    assert archive_response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_faculty_can_create_and_publish_own_material(api_client, learning_context):
    faculty_user = learning_context["faculty_user"]

    api_client.force_authenticate(user=faculty_user)
    response = api_client.post(
        "/api/learning/materials/",
        {
            "title": "Lecture Link",
            "kind": LearningMaterial.KIND_LINK,
            "url": "https://example.com",
            "available_from": (timezone.now() - timedelta(days=1)).isoformat(),
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED

    material_id = response.data["id"]
    publish_response = api_client.post(f"/api/learning/materials/{material_id}/publish/")

    assert publish_response.status_code == status.HTTP_200_OK
    assert publish_response.data["status"] == LearningMaterial.STATUS_PUBLISHED


@pytest.mark.django_db
def test_faculty_cannot_publish_other_material(api_client, learning_context):
    other_faculty = learning_context["other_faculty"]
    material = LearningMaterial.objects.create(
        title="Draft",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com",
        created_by=learning_context["faculty_user"],
    )

    api_client.force_authenticate(user=other_faculty)
    publish_response = api_client.post(f"/api/learning/materials/{material.id}/publish/")

    assert publish_response.status_code == status.HTTP_403_FORBIDDEN
