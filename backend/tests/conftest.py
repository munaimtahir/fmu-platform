import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient


@pytest.fixture(scope="session", autouse=True)
def ensure_roles(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        for name in ("ADMIN", "COORDINATOR", "FACULTY", "FINANCE", "STUDENT", "OFFICE_ASSISTANT"):
            Group.objects.get_or_create(name=name)
    yield


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def admin_user(db):
    user = User.objects.create_user(username="admin1", password="pass")
    user.is_superuser = True
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def registrar_user(db):
    user = User.objects.create_user(username="registrar1", password="pass")
    # Using OFFICE_ASSISTANT or creating Registrar as needed, but standard roles are uppercase.
    # If Registrar is not a standard MVP role, we might need to create it or map it.
    # Assuming "Registrar" was intended to be "COORDINATOR" or "OFFICE_ASSISTANT" or a specific role.
    # For now, let's create it if missing to fix the test, but note the casing mismatch.
    group, _ = Group.objects.get_or_create(name="Registrar")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def student_user(db):
    user = User.objects.create_user(username="STU-0001", password="pass")
    # MVP roles use uppercase "STUDENT"
    user.groups.add(Group.objects.get(name="STUDENT"))
    user.save()
    return user
