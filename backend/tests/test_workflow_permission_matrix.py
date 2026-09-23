from types import SimpleNamespace

import pytest
from django.contrib.auth.models import AnonymousUser, Group, User
from rest_framework.exceptions import PermissionDenied

from sims_backend import common_permissions as permissions
from sims_backend.common.workflow import validate_workflow_transition


@pytest.fixture
def role_user(db):
    def create(role=None, superuser=False):
        user = User.objects.create_user(username=f"matrix-{User.objects.count()}", is_superuser=superuser)
        if role:
            user.groups.add(Group.objects.get_or_create(name=role)[0])
        return user
    return create


@pytest.mark.parametrize("role", ["ADMIN", "COORDINATOR", "OFFICE_ASSISTANT", "STUDENT", None])
@pytest.mark.parametrize("before,after", [
    ("DRAFT", "DRAFT"), ("DRAFT", "VERIFIED"), ("VERIFIED", "VERIFIED"),
    ("VERIFIED", "PUBLISHED"), ("DRAFT", "PUBLISHED"), ("PUBLISHED", "DRAFT"),
])
def test_role_state_transition_matrix(role_user, role, before, after):
    user = role_user(role)
    allowed = (role in {"ADMIN", "COORDINATOR"} and (before, after) in {
        ("DRAFT", "DRAFT"), ("DRAFT", "VERIFIED"), ("VERIFIED", "VERIFIED"), ("VERIFIED", "PUBLISHED")
    }) or (role == "OFFICE_ASSISTANT" and before == after == "DRAFT")
    assert permissions.can_transition_workflow_state(user, before, after) == allowed
    if allowed or before == after:
        assert validate_workflow_transition(user, None, before, after) is None
    else:
        with pytest.raises(PermissionDenied, match="Invalid workflow state transition"):
            validate_workflow_transition(user, None, before, after)


def test_anonymous_and_superuser_transitions(role_user):
    assert not permissions.can_transition_workflow_state(None, "DRAFT", "VERIFIED")
    with pytest.raises(PermissionDenied, match="anonymous users"):
        validate_workflow_transition(None, None, "DRAFT", "VERIFIED")
    user = role_user(superuser=True)
    assert permissions.can_transition_workflow_state(user, "DRAFT", "VERIFIED")
    with pytest.raises(PermissionDenied, match="Admin/Coordinator"):
        validate_workflow_transition(user, None, "PUBLISHED", "DRAFT")


@pytest.mark.parametrize("permission,allowed", [
    (permissions.IsAdmin, {"ADMIN"}),
    (permissions.IsAdminOrCoordinator, {"ADMIN", "COORDINATOR"}),
    (permissions.IsFaculty, {"FACULTY"}),
    (permissions.IsFinance, {"ADMIN", "FINANCE"}),
    (permissions.IsStudent, {"STUDENT"}),
    (permissions.IsOfficeAssistant, {"OFFICE_ASSISTANT"}),
])
@pytest.mark.parametrize("role", ["ADMIN", "COORDINATOR", "FACULTY", "FINANCE", "STUDENT", "OFFICE_ASSISTANT", "REGISTRAR", None])
def test_permission_role_matrix(role_user, permission, allowed, role):
    user = role_user(role)
    assert bool(permission().has_permission(SimpleNamespace(user=user, method="POST"), None)) == (role in allowed)


@pytest.mark.parametrize("permission", [
    permissions.IsAdmin, permissions.IsAdminOrCoordinator, permissions.IsFaculty,
    permissions.IsFinance, permissions.IsStudent, permissions.IsOfficeAssistant,
    permissions.IsAdminOrRegistrarReadOnlyFacultyStudent,
])
@pytest.mark.parametrize("user", [None, AnonymousUser()])
def test_unauthenticated_requests_denied(permission, user):
    assert not permission().has_permission(SimpleNamespace(user=user, method="GET"), None)


@pytest.mark.parametrize("role,status,expected", [
    ("ADMIN", "PUBLISHED", False), ("COORDINATOR", "VERIFIED", False),
    ("OFFICE_ASSISTANT", "DRAFT", True), ("OFFICE_ASSISTANT", "PUBLISHED", False),
    ("OFFICE_ASSISTANT", None, True), ("STUDENT", "DRAFT", False),
])
def test_draft_edit_restrictions(role_user, role, status, expected):
    record = SimpleNamespace() if status is None else SimpleNamespace(status=status)
    assert permissions.can_edit_draft_only(role_user(role), record) is expected


def test_mixed_admin_roles_do_not_inherit_admin_only_access(role_user):
    user = role_user("ADMIN")
    user.groups.add(Group.objects.get_or_create(name="STUDENT")[0])
    assert not permissions.IsAdmin().has_permission(SimpleNamespace(user=user), None)
    user.is_superuser = True
    assert permissions.IsAdmin().has_permission(SimpleNamespace(user=user), None)
    assert not permissions.can_edit_draft_only(user, SimpleNamespace(status="DRAFT"))


def test_group_lookup_handles_missing_user_and_invalid_manager():
    assert not permissions.in_group(None, "ADMIN")
    assert not permissions.in_group(SimpleNamespace(groups=None), "ADMIN")


@pytest.mark.parametrize("role", ["ADMIN", "REGISTRAR", "FACULTY", "STUDENT"])
@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS", "POST"])
def test_read_only_and_staff_permissions(role_user, role, method):
    request = SimpleNamespace(user=role_user(role), method=method)
    assert permissions.IsAdminOrRegistrarReadOnlyFacultyStudent().has_permission(request, None) == (
        role in {"ADMIN", "REGISTRAR"} or method in {"GET", "HEAD", "OPTIONS"}
    )
