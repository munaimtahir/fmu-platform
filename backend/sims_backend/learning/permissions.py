from rest_framework.permissions import BasePermission, SAFE_METHODS

from sims_backend.common_permissions import in_group
from sims_backend.learning.models import LearningMaterial


class IsAdminOrFaculty(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_superuser or in_group(user, "ADMIN") or in_group(user, "FACULTY")


class LearningMaterialObjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj: LearningMaterial) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or in_group(user, "ADMIN"):
            return True
        if view.action in {"update", "partial_update", "destroy"}:
            return obj.created_by_id == user.id and obj.status == LearningMaterial.STATUS_DRAFT
        if view.action in {"publish", "archive"}:
            return obj.created_by_id == user.id
        if view.action == "audiences":
            if request.method in SAFE_METHODS:
                return True
            return obj.created_by_id == user.id
        if request.method in SAFE_METHODS:
            return True
        return False


class IsStudentOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return in_group(user, "STUDENT")
