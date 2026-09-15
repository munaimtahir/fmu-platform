import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient

from core.permissions import has_permission_task
from sims_backend.admin.serializers import AdminUserCreateSerializer, AdminUserSerializer


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role,task",
    [
        ("REGISTRAR", "students.students.create"),
        ("REGISTRAR", "people.persons.update"),
        ("REGISTRAR", "academics.programs.manage"),
        ("COORDINATOR", "students.students.manage_placement"),
        ("EXAMCELL", "exams.exams.publish"),
        ("EXAMCELL", "results.result_components.create"),
        ("EXAMCELL", "results.result_corrections.apply"),
        ("FINANCE", "finance.payments.reverse"),
    ],
)
def test_phase_3_to_5_builtin_role_contract(role, task):
    user = User.objects.create_user(username=f"android_{role.lower()}")
    group, _ = Group.objects.get_or_create(name=role)
    user.groups.add(group)
    assert has_permission_task(user, task)


@pytest.mark.django_db
@pytest.mark.parametrize("group_name,expected", [("COORDINATOR", "Coordinator"), ("OFFICE_ASSISTANT", "OfficeAssistant")])
def test_admin_serializer_exposes_all_managed_roles(group_name, expected):
    user = User.objects.create_user(username=f"managed_{group_name.lower()}")
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)
    assert AdminUserSerializer(user).data["role"] == expected


@pytest.mark.django_db
def test_admin_user_create_rejects_unknown_role_without_creating_user():
    serializer = AdminUserCreateSerializer(data={"username": "bad_role", "password": "strong-pass", "role": "ROOT"})
    assert not serializer.is_valid()
    assert "role" in serializer.errors
    assert not User.objects.filter(username="bad_role").exists()


@pytest.mark.django_db
def test_exam_write_is_denied_without_exam_task():
    user = User.objects.create_user(username="unprivileged_android")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.post("/api/exams/", {}, format="json")
    assert response.status_code == 403
