"""
Permission helpers for task-based RBAC system.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import BasePermission

if TYPE_CHECKING:
    from django.contrib.auth.models import User


def has_permission_task(user: User, task_code: str) -> bool:
    """
    Check if user has a permission task either via:
    1. Direct user assignment
    2. Role assignment (user belongs to a role with the task)

    Superusers always have all permissions.
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    from core.models import PermissionTask, Role, RoleTaskAssignment, UserTaskAssignment

    # Built-in role fallback for critical permissions. The task table remains
    # canonical when populated, but seeded/local environments must not lose all
    # API access when task rows are absent.
    fallback = _has_builtin_role_task(user, task_code)

    # Check direct user assignment
    try:
        task = PermissionTask.objects.get(code=task_code)
        if UserTaskAssignment.objects.filter(user=user, task=task).exists():
            return True
    except PermissionTask.DoesNotExist:
        return fallback

    # Check role assignments
    # Get user's roles (from Django Groups, mapped to our Role model)
    user_roles = get_user_roles(user)

    if not user_roles:
        return False

    role_names = [role.name for role in user_roles]
    roles = Role.objects.filter(name__in=role_names)

    return RoleTaskAssignment.objects.filter(role__in=roles, task=task).exists() or fallback


def _user_in_group(user: User, group_name: str) -> bool:
    try:
        return bool(user.groups.filter(name__iexact=group_name).exists())
    except (AttributeError, TypeError):
        return False


def _has_builtin_role_task(user: User, task_code: str) -> bool:
    """Conservative fallback RBAC map for seeded environments without task rows."""
    if _user_in_group(user, "ADMIN") and not any(
        _user_in_group(user, role)
        for role in ["REGISTRAR", "EXAMCELL", "FACULTY", "FINANCE", "STUDENT", "COORDINATOR", "OFFICE_ASSISTANT"]
    ):
        return True

    role_task_prefixes = {
        "REGISTRAR": [
            "students.students.view",
            "students.students.manage_placement",
            "academics.programs.view",
            "academics.batches.view",
            "academics.terms.view",
            "academics.groups.view",
            "academics.departments.view",
            "academics.courses.view",
            "academics.sections.view",
            # Registrar is a designated timetable manager alongside Admin/Coordinator.
            "timetable.",
        ],
        "FACULTY": [
            "academics.courses.view",
            "academics.sections.view",
            # Faculty need to browse batches/periods/groups read-only to
            # drive the /timetable page (batch + academic period selectors,
            # and the EntryForm's group dropdown) — without these, the
            # shipped timetable editor is unusable for Faculty even though
            # they are its primary intended user alongside Admin/Coordinator.
            "academics.batches.view",
            "academics.terms.view",
            "academics.groups.view",
            "results.result_headers.view",
            "results.result_components.view",
            # Faculty can manage their own sessions/draft timetables/entries
            # (object-level ownership is still enforced inside the view/
            # action bodies), but cannot hard-delete entries.
            "timetable.sessions.view",
            "timetable.sessions.create",
            "timetable.sessions.update",
            "timetable.sessions.delete",
            "timetable.weekly.view",
            "timetable.weekly.create",
            "timetable.weekly.update",
            "timetable.weekly.manage",
            "timetable.cells.view",
            "timetable.cells.create",
            "timetable.cells.update",
            "timetable.cells.delete",
            "timetable.entries.view",
            "timetable.entries.create",
            "timetable.entries.update",
            "timetable.entries.cancel",
        ],
        "EXAMCELL": [
            "exams.exams.view",
            "exams.components.view",
            "results.result_headers.view",
            "results.result_headers.verify",
            "results.result_headers.publish",
            "results.result_headers.freeze",
            "results.result_components.view",
            "results.result_corrections.review",
        ],
        "FINANCE": [
            "finance.",
        ],
        "COORDINATOR": [
            # Coordinator is a designated timetable manager per RBAC matrix,
            # and (like Faculty) needs read-only batch/period/group access
            # to drive the /timetable page's selectors.
            "timetable.",
            "academics.batches.view",
            "academics.terms.view",
            "academics.groups.view",
        ],
        "STUDENT": [
            # Students may only ever read published schedules; queryset-level
            # filtering (in_group checks in timetable views) still restricts
            # them to published data regardless of this task grant.
            "timetable.sessions.view",
            "timetable.weekly.view",
            "timetable.cells.view",
            "timetable.entries.view",
        ],
    }

    for role, allowed in role_task_prefixes.items():
        if _user_in_group(user, role) and any(task_code == item or task_code.startswith(item) for item in allowed):
            return True

    return False


def has_any_permission_task(user: User, task_codes: list[str]) -> bool:
    """Check if user has any of the specified tasks."""
    return any(has_permission_task(user, code) for code in task_codes)


def has_all_permission_tasks(user: User, task_codes: list[str]) -> bool:
    """Check if user has all of the specified tasks."""
    return all(has_permission_task(user, code) for code in task_codes)


def get_user_roles(user: User) -> list:
    """
    Get Role objects for a user based on their Django Group memberships.
    """
    from core.models import Role

    if not user or not user.is_authenticated:
        return []

    # Map Django Groups to Role model
    group_names = user.groups.values_list("name", flat=True)
    return list(Role.objects.filter(name__in=group_names))


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
