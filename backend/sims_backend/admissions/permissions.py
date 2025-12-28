from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Student


def _in_group(user, group_name: str) -> bool:
    try:
        return bool(user.groups.filter(name=group_name).exists())
    except Exception:
        return False


class IsAdminOrRegistrarOrReadOwnStudent(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if (
            user.is_superuser
            or _in_group(user, "Admin")
            or _in_group(user, "Registrar")
        ):
            return True
        if _in_group(user, "Student"):
            return request.method in SAFE_METHODS
        return False

    def has_object_permission(self, request, view, obj: Student) -> bool:
        user = request.user
        if (
            user.is_superuser
            or _in_group(user, "Admin")
            or _in_group(user, "Registrar")
        ):
            return True
        if _in_group(user, "Student") and request.method in SAFE_METHODS:
            return getattr(user, "username", None) == obj.reg_no
        return False
