from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response

from sims_backend.common_permissions import in_group


class AudiencePermissionMixin:
    """Mixin for validating audience permissions and handling permission errors."""

    def _validate_audience_permissions(self, data: dict) -> None:
        """Validate that the user has permission to create/manage audiences with the given data.
        
        Args:
            data: Validated data containing audience scope fields
            
        Raises:
            PermissionError: If user doesn't have permission to manage this audience
        """
        user = self.request.user
        if user.is_superuser or in_group(user, "ADMIN"):
            return
        if in_group(user, "FACULTY"):
            section = data.get("section")
            if not section:
                raise PermissionError("Faculty audiences must target a section.")
            if section.faculty_id != user.id:
                raise PermissionError("Faculty can only target sections they teach.")
            return
        raise PermissionError("You do not have permission to manage audiences.")

    def handle_exception(self, exc):
        """Handle PermissionError exceptions by returning 403 responses."""
        if isinstance(exc, PermissionError):
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return super().handle_exception(exc)
