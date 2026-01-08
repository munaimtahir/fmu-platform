"""
Permission helpers for task-based RBAC system.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import BasePermission

if TYPE_CHECKING:
    from django.contrib.auth.models import User


def has_permission_task(user: "User", task_code: str) -> bool:
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
    
    from core.models import PermissionTask, RoleTaskAssignment, UserTaskAssignment, Role
    
    # Check direct user assignment
    try:
        task = PermissionTask.objects.get(code=task_code)
        if UserTaskAssignment.objects.filter(user=user, task=task).exists():
            return True
    except PermissionTask.DoesNotExist:
        return False
    
    # Check role assignments
    # Get user's roles (from Django Groups, mapped to our Role model)
    user_roles = get_user_roles(user)
    
    if not user_roles:
        return False
    
    role_names = [role.name for role in user_roles]
    roles = Role.objects.filter(name__in=role_names)
    
    return RoleTaskAssignment.objects.filter(role__in=roles, task=task).exists()


def has_any_permission_task(user: "User", task_codes: list[str]) -> bool:
    """Check if user has any of the specified tasks."""
    return any(has_permission_task(user, code) for code in task_codes)


def has_all_permission_tasks(user: "User", task_codes: list[str]) -> bool:
    """Check if user has all of the specified tasks."""
    return all(has_permission_task(user, code) for code in task_codes)


def get_user_roles(user: "User") -> list:
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
