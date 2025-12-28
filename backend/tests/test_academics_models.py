from datetime import date

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from sims_backend.academics.models import Course, Program, Section, Term

User = get_user_model()


@pytest.mark.django_db
def test_academics_models_str_and_save_behaviour():
    term = Term.objects.create(
        name="Fall 2025",
        status="open",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 6, 1),
    )
    assert "Fall 2025" in str(term)

    program = Program.objects.create(name="Computer Science")
    assert str(program) == "Computer Science"

    course = Course.objects.create(
        code="CS101", title="Intro to CS", credits=3, program=program
    )
    assert str(course) == "CS101 - Intro to CS"

    teacher = User.objects.create_user(
        username="faculty1", first_name="Ada", last_name="Lovelace", password="pass"
    )
    section = Section.objects.create(
        course=course, term="Fall-25", teacher=teacher, capacity=40
    )
    assert section.teacher_name == "Ada Lovelace"
    assert "Ada Lovelace" in str(section)

    # Removing the teacher should fall back to the default display string
    section.teacher = None
    section.teacher_name = ""
    section.save()
    assert "No teacher" in str(section)


@pytest.mark.django_db
def test_section_duplicate_teacher_name_update_raises():
    program = Program.objects.create(name="Business Analytics")
    course = Course.objects.create(
        code="BA101", title="Intro", credits=3, program=program
    )
    _original = Section.objects.create(
        course=course, term="Fall-25", teacher="Dr. Same"
    )
    other = Section.objects.create(course=course, term="Fall-25", teacher="Dr. Other")

    other.teacher_name = "Dr. Same"
    with pytest.raises(IntegrityError):
        other.save()
