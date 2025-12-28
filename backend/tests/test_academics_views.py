import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIRequestFactory

from sims_backend.academics.models import Course, Program, Section
from sims_backend.academics.views import SectionViewSet

User = get_user_model()


@pytest.fixture()
def faculty_user(db):
    group, _ = Group.objects.get_or_create(name="Faculty")
    user = User.objects.create_user(username="faculty-only", password="pass")
    user.groups.add(group)
    return user


@pytest.mark.django_db
def test_section_viewset_queryset_admin_sees_all(admin_user):
    program = Program.objects.create(name="Business")
    course = Course.objects.create(
        code="BUS101", title="Intro", credits=3, program=program
    )
    other_course = Course.objects.create(
        code="BUS102", title="Mgmt", credits=3, program=program
    )
    Section.objects.create(course=course, term="Fall-25")
    Section.objects.create(course=other_course, term="Fall-25")

    viewset = SectionViewSet()
    factory = APIRequestFactory()
    request = factory.get("/api/sections/")
    request.user = admin_user
    viewset.request = request

    assert Section.objects.count() == viewset.get_queryset().count()


@pytest.mark.django_db
def test_section_viewset_queryset_faculty_filtered(faculty_user):
    program = Program.objects.create(name="Arts")
    course = Course.objects.create(
        code="ART100", title="Foundations", credits=3, program=program
    )
    other_course = Course.objects.create(
        code="ART200", title="Studio", credits=3, program=program
    )
    mine = Section.objects.create(course=course, term="Fall-25", teacher=faculty_user)
    Section.objects.create(course=other_course, term="Fall-25")

    viewset = SectionViewSet()
    factory = APIRequestFactory()
    request = factory.get("/api/sections/")
    request.user = faculty_user
    viewset.request = request

    queryset = viewset.get_queryset()
    assert list(queryset) == [mine]
