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


@pytest.mark.django_db
def test_student_feed_multi_field_audience_filtering(api_client, learning_feed_setup):
    """Test that multi-field audiences use AND semantics - students must match ALL fields."""
    data = learning_feed_setup
    faculty = data["faculty_user"]
    student_user = data["student_user"]
    student = data["student"]

    # Create another batch in the same program
    other_batch = Batch.objects.create(name="Batch 2025", program=data["program"], start_year=2025)
    other_group = AcadGroup.objects.create(name="Group C", batch=other_batch)
    other_student_user = User.objects.create_user(username="student2", password="pass")
    other_student_user.groups.add(Group.objects.get(name="STUDENT"))
    other_student = Student.objects.create(
        user=other_student_user,
        reg_no="REG-002",
        name="Student Two",
        program=data["program"],  # Same program
        batch=other_batch,  # Different batch
        group=other_group,
    )

    # Material 1: Program + Batch (specific combination) - should only match student in that exact batch
    program_batch_material = LearningMaterial.objects.create(
        title="Program+Batch Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/prog-batch",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(
        material=program_batch_material,
        program=data["program"],
        batch=data["batch"],  # Student 1's batch
    )
    program_batch_material.publish()

    # Material 2: Program + Other Batch - should only match other student
    other_program_batch_material = LearningMaterial.objects.create(
        title="Program+OtherBatch Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/prog-other-batch",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(
        material=other_program_batch_material,
        program=data["program"],
        batch=other_batch,  # Student 2's batch
    )
    other_program_batch_material.publish()

    # Material 3: Batch only - should match student 1 only
    batch_only_material = LearningMaterial.objects.create(
        title="Batch Only Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/batch",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=batch_only_material, batch=data["batch"])
    batch_only_material.publish()

    # Material 4: Program only - should match both students
    program_only_material = LearningMaterial.objects.create(
        title="Program Only Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/program",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=program_only_material, program=data["program"])
    program_only_material.publish()

    # Test student 1's feed
    api_client.force_authenticate(user=student_user)
    response1 = api_client.get("/api/learning/student-feed/")
    assert response1.status_code == status.HTTP_200_OK
    payload1 = response1.json()
    ids1 = {item["id"] for item in payload1}

    # Student 1 should see: program+batch (their batch), batch-only, program-only
    assert program_batch_material.id in ids1, "Should see material for their program+batch"
    assert batch_only_material.id in ids1, "Should see material for their batch"
    assert program_only_material.id in ids1, "Should see material for their program"
    # Should NOT see the other batch's material
    assert other_program_batch_material.id not in ids1, "Should NOT see material for different batch"

    # Test student 2's feed
    api_client.force_authenticate(user=other_student_user)
    response2 = api_client.get("/api/learning/student-feed/")
    assert response2.status_code == status.HTTP_200_OK
    payload2 = response2.json()
    ids2 = {item["id"] for item in payload2}

    # Student 2 should see: program+other_batch, program-only
    assert other_program_batch_material.id in ids2, "Should see material for their program+batch"
    assert program_only_material.id in ids2, "Should see material for their program"
    # Should NOT see student 1's batch-specific materials
    assert program_batch_material.id not in ids2, "Should NOT see material for different batch"
    assert batch_only_material.id not in ids2, "Should NOT see material for different batch"


@pytest.mark.django_db
def test_student_feed_excludes_published_materials_without_audiences(api_client, learning_feed_setup):
    """Test that published materials without audiences are not shown in student feeds."""
    data = learning_feed_setup
    faculty = data["faculty_user"]
    student_user = data["student_user"]

    # Create a published material with NO audiences
    material_no_audience = LearningMaterial.objects.create(
        title="No Audience Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/no-audience",
        created_by=faculty,
    )
    material_no_audience.publish()

    # Create a published material WITH audience
    material_with_audience = LearningMaterial.objects.create(
        title="With Audience Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com/with-audience",
        created_by=faculty,
    )
    LearningMaterialAudience.objects.create(material=material_with_audience, program=data["program"])
    material_with_audience.publish()

    # Check student feed
    api_client.force_authenticate(user=student_user)
    response = api_client.get("/api/learning/student-feed/")
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    ids = {item["id"] for item in payload}

    # Should see material with audience
    assert material_with_audience.id in ids, "Should see material with matching audience"
    # Should NOT see material without audience
    assert material_no_audience.id not in ids, "Should NOT see material without audiences"

