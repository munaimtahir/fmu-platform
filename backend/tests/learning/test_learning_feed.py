from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, User
from django.utils import timezone
from rest_framework import status

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group as AcadGroup, Program, Section
from sims_backend.learning.models import LearningMaterial, LearningMaterialAudience
from sims_backend.students.models import Student


@pytest.fixture
def learning_feed_setup(db):
    program = Program.objects.create(name="MBBS", description="Program")
    batch = Batch.objects.create(name="Batch 2024", program=program, start_year=2024)
    group = AcadGroup.objects.create(name="Group A", batch=batch)
    other_group = AcadGroup.objects.create(name="Group B", batch=batch)
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

    section = Section.objects.create(
        course=course,
        academic_period=term,
        faculty=faculty_user,
        group=group,
        name="Section A",
    )
    other_section = Section.objects.create(
        course=course,
        academic_period=term,
        faculty=faculty_user,
        group=other_group,
        name="Section B",
    )

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

    return {
        "program": program,
        "batch": batch,
        "group": group,
        "term": term,
        "course": course,
        "section": section,
        "other_section": other_section,
        "faculty_user": faculty_user,
        "student_user": student_user,
        "student": student,
    }


@pytest.mark.django_db
def test_student_feed_filters_materials(api_client, learning_feed_setup):
    data = learning_feed_setup
    faculty = data["faculty_user"]

    program_material = LearningMaterial.objects.create(
        title="Program Guide",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/program",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=program_material, program=data["program"])
    program_material.publish()

    draft_material = LearningMaterial.objects.create(
        title="Draft",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/draft",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=draft_material, program=data["program"])

    future_material = LearningMaterial.objects.create(
        title="Future",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/future",
        available_from=timezone.now() + timedelta(days=1),
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=future_material, program=data["program"])
    future_material.publish()

    section_material = LearningMaterial.objects.create(
        title="Section Only",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/section",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=section_material, section=data["section"])
    section_material.publish()

    other_section_material = LearningMaterial.objects.create(
        title="Other Section",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/other",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=other_section_material, section=data["other_section"])
    other_section_material.publish()

    course_term_material = LearningMaterial.objects.create(
        title="Course Term",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/course-term",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(
        material=course_term_material,
        course=data["course"],
        term=data["term"],
    )
    course_term_material.publish()

    term_material = LearningMaterial.objects.create(
        title="Term",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/term",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=term_material, term=data["term"])
    term_material.publish()

    api_client.force_authenticate(user=data["student_user"])
    response = api_client.get("/api/learning/student-feed/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    ids = {item["id"] for item in payload}

    assert program_material.id in ids
    assert section_material.id in ids
    assert course_term_material.id in ids
    assert term_material.id in ids

    assert draft_material.id not in ids
    assert future_material.id not in ids
    assert other_section_material.id not in ids
