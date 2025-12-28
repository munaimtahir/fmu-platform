import pytest
from django.contrib.auth import get_user_model

from sims_backend.academics.models import Course, Program
from sims_backend.academics.serializers import SectionSerializer

User = get_user_model()


@pytest.mark.django_db
def test_section_serializer_accepts_teacher_name_string():
    program = Program.objects.create(name="Engineering")
    course = Course.objects.create(
        code="ENG100", title="Intro", credits=3, program=program
    )

    serializer = SectionSerializer(
        data={"course": course.pk, "term": "Fall-25", "teacher": "Dr. Smith"}
    )
    assert serializer.is_valid(), serializer.errors
    section = serializer.save()

    assert section.teacher is None
    assert section.teacher_name == "Dr. Smith"


@pytest.mark.django_db
def test_section_serializer_handles_teacher_relationship():
    program = Program.objects.create(name="Mathematics")
    course = Course.objects.create(
        code="MATH101", title="Calculus", credits=4, program=program
    )
    teacher = User.objects.create_user(
        username="calc", first_name="Isaac", last_name="Newton", password="pass"
    )

    serializer = SectionSerializer(
        data={"course": course.pk, "term": "Spring-26", "teacher": teacher.pk}
    )
    assert serializer.is_valid(), serializer.errors
    section = serializer.save()

    assert section.teacher == teacher
    # save() should auto-populate the teacher_name from the related user
    assert section.teacher_name == "Isaac Newton"


@pytest.mark.django_db
def test_section_serializer_create_handles_string_validated_data():
    program = Program.objects.create(name="Physics")
    course = Course.objects.create(
        code="PHY100", title="Mechanics", credits=3, program=program
    )

    serializer = SectionSerializer()
    section = serializer.create(
        {
            "course": course,
            "term": "Winter-26",
            "teacher": "Dr. Who",
            "teacher_name": "",
        }
    )

    assert section.teacher is None
    assert section.teacher_name == "Dr. Who"
