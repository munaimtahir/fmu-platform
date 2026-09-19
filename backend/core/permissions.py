"""
Permission helpers for task-based RBAC system.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import BasePermission

from core.rbac_catalog import (
    BUILTIN_ADMIN_ALWAYS_PREFIXES,
    BUILTIN_ROLE_PREFIXES,
    DOMAIN_ROLE_GROUPS,
    SYSTEM_ROLES,
    TASK_CODES,
    builtin_prefix_grants,
)

if TYPE_CHECKING:
    from django.contrib.auth.models import User


def get_user_group_names(user: User) -> set[str]:
    """Upper-cased Django Group names for ``user`` (group spellings vary in case)."""
    try:
        return {name.upper() for name in user.groups.values_list("name", flat=True)}
    except (AttributeError, TypeError):
        return set()


def _builtin_allows(group_names: set[str], task_code: str) -> bool:
    """Built-in role grants, evaluated from a pre-fetched set of group names."""
    if "ADMIN" in group_names:
        if not group_names.intersection(DOMAIN_ROLE_GROUPS):
            return True
        if task_code.startswith(BUILTIN_ADMIN_ALWAYS_PREFIXES):
            return True

    return any(role in group_names and builtin_prefix_grants(role, task_code) for role in BUILTIN_ROLE_PREFIXES)


def _has_builtin_role_task(user: User, task_code: str) -> bool:
    return _builtin_allows(get_user_group_names(user), task_code)


def has_permission_task(user: User, task_code: str) -> bool:
    """
    Check if user has a permission task via any of:
    1. Superuser status
    2. Built-in role grants (``core.rbac_catalog.BUILTIN_ROLE_PREFIXES``)
    3. Direct user assignment
    4. Role assignment (user belongs to a group whose name matches a Role)

    The built-in grants are always consulted, so populating the task tables
    can only add access, never remove it.
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    group_names = get_user_group_names(user)
    if _builtin_allows(group_names, task_code):
        return True

    from core.models import RoleTaskAssignment, UserTaskAssignment

    if UserTaskAssignment.objects.filter(user=user, task__code=task_code).exists():
        return True

    role_ids = _role_ids_for_groups(group_names)
    if not role_ids:
        return False
    return RoleTaskAssignment.objects.filter(role_id__in=role_ids, task__code=task_code).exists()


def _role_ids_for_groups(group_names: set[str]) -> list[int]:
    from django.db.models.functions import Lower

    from core.models import Role

    if not group_names:
        return []
    lowered = [name.lower() for name in group_names]
    return list(Role.objects.annotate(name_lower=Lower("name")).filter(name_lower__in=lowered).values_list("id", flat=True))


def has_any_permission_task(user: User, task_codes: list[str]) -> bool:
    """Check if user has any of the specified tasks."""
    return any(has_permission_task(user, code) for code in task_codes)


def has_all_permission_tasks(user: User, task_codes: list[str]) -> bool:
    """Check if user has all of the specified tasks."""
    return all(has_permission_task(user, code) for code in task_codes)


def get_user_roles(user: User) -> list:
    """
    Get Role objects for a user based on their Django Group memberships.

    Group and Role names are matched case-insensitively (groups exist as both
    ``STUDENT`` and ``Student`` in real data).
    """
    from core.models import Role

    if not user or not user.is_authenticated:
        return []

    role_ids = _role_ids_for_groups(get_user_group_names(user))
    return list(Role.objects.filter(id__in=role_ids))


def get_effective_roles(user: User) -> list[dict]:
    """Roles for the access context: Role rows plus canonical roles implied by groups.

    Canonical roles without a Role row (e.g. before the catalog is seeded) are
    returned with ``id`` None so callers always see a complete list.
    """
    if not user or not user.is_authenticated:
        return []

    group_names = get_user_group_names(user)
    if user.is_superuser:
        group_names = group_names | {"ADMIN"}

    rows = {r.name.upper(): r for r in get_user_roles(user)}
    if user.is_superuser:
        from core.models import Role

        admin_role = Role.objects.filter(name__iexact="ADMIN").first()
        if admin_role:
            rows["ADMIN"] = admin_role

    roles = [{"id": r.id, "name": r.name, "description": r.description} for r in rows.values()]
    for canonical, description in SYSTEM_ROLES.items():
        if canonical in group_names and canonical not in rows:
            roles.append({"id": None, "name": canonical, "description": description})
    return sorted(roles, key=lambda r: r["name"])


def get_effective_task_codes(user: User) -> set[str]:
    """Every task code the user holds: direct, via roles, built-in grants, or superuser."""
    if not user or not user.is_authenticated:
        return set()

    from core.models import PermissionTask, RoleTaskAssignment, UserTaskAssignment

    known_codes = set(PermissionTask.objects.values_list("code", flat=True)) | set(TASK_CODES)
    if user.is_superuser:
        return known_codes

    group_names = get_user_group_names(user)
    codes = set(UserTaskAssignment.objects.filter(user=user).values_list("task__code", flat=True))
    role_ids = _role_ids_for_groups(group_names)
    if role_ids:
        codes |= set(RoleTaskAssignment.objects.filter(role_id__in=role_ids).values_list("task__code", flat=True))
    codes |= {code for code in known_codes if _builtin_allows(group_names, code)}
    return codes


class PermissionTaskRequired(BasePermission):
    """
    DRF permission class that checks for permission tasks.

    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [PermissionTaskRequired]
            required_tasks = ["students.view", "students.edit"]
    """

    required_tasks: list[str] = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Get required_tasks from view or class attribute
        required_tasks = getattr(view, "required_tasks", self.required_tasks)

        if not required_tasks:
            return False

        return has_any_permission_task(request.user, required_tasks)

    def has_object_permission(self, request, view, obj):
        # Override if needed for object-level permissions
        return self.has_permission(request, view)
