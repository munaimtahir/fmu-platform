from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.exceptions import PermissionDenied


def in_group(user, group_name: str) -> bool:
    try:
        return bool(user.groups.filter(name=group_name).exists())
    except (AttributeError, TypeError):
        return False


class IsAdminOrRegistrarReadOnlyFacultyStudent(BasePermission):
    """
    Admin/Registrar: full access.
    Faculty/Student: read-only (SAFE methods). Refine per-module if needed.
    """

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser or in_group(u, "Admin") or in_group(u, "Registrar"):
            return True
        return request.method in SAFE_METHODS


class IsAdmin(BasePermission):
    """Admin only access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.is_superuser or in_group(u, "ADMIN")


class IsAdminOrCoordinator(BasePermission):
    """Admin or Coordinator access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.is_superuser or in_group(u, "ADMIN") or in_group(u, "COORDINATOR")


class IsFaculty(BasePermission):
    """Faculty access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return in_group(u, "FACULTY")


class IsFinance(BasePermission):
    """Finance role access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return u.is_superuser or in_group(u, "ADMIN") or in_group(u, "FINANCE")


class IsStudent(BasePermission):
    """Student role access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return in_group(u, "STUDENT")


class IsOfficeAssistant(BasePermission):
    """Office Assistant role access"""

    def has_permission(self, request, view) -> bool:
        u = request.user
        if not u or not u.is_authenticated:
            return False
        return in_group(u, "OFFICE_ASSISTANT")


def can_edit_draft_only(user, instance) -> bool:
    """Check if user can only edit DRAFT state records"""
    if user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR"):
        return False  # Can edit any state
    if in_group(user, "OFFICE_ASSISTANT"):
        # Office Assistant can only work with DRAFT
        if hasattr(instance, "status"):
            return instance.status == "DRAFT"
        return True  # If no status field, allow (shouldn't happen)
    return False


def can_transition_workflow_state(user, from_state: str, to_state: str) -> bool:
    """
    Validate workflow state transition based on user role.
    Returns True if transition is allowed, False otherwise.
    """
    if user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR"):
        # Admin/Coordinator can transition: DRAFT -> VERIFIED -> PUBLISHED
        valid_transitions = [
            ("DRAFT", "VERIFIED"),
            ("VERIFIED", "PUBLISHED"),
            ("DRAFT", "DRAFT"),  # Stay in draft
            ("VERIFIED", "VERIFIED"),  # Stay in verified
        ]
        return (from_state, to_state) in valid_transitions
    
    if in_group(user, "OFFICE_ASSISTANT"):
        # Office Assistant can only keep records in DRAFT
        return from_state == "DRAFT" and to_state == "DRAFT"
    
    # Other roles cannot transition states
    return False
