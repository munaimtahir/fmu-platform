"""Custom JWT authentication that extracts impersonation claims."""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied


PASSWORD_CHANGE_ALLOWED_PATHS = {
    "/api/auth/me/",
    "/api/auth/change-password/",
    "/api/auth/logout/",
}


class ImpersonationJWTAuthentication(JWTAuthentication):
    """JWT auth that extracts impersonation claims."""

    def authenticate(self, request):
        """Authenticate and extract impersonation claims."""
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        student = getattr(user, "student", None)
        token_version = validated_token.get("student_credential_version")
        if student is not None:
            if token_version is None or token_version != student.credential_version:
                raise AuthenticationFailed("Student credentials have changed", code="credentials_changed")
            if student.password_change_required and request.path not in PASSWORD_CHANGE_ALLOWED_PATHS:
                raise PermissionDenied(
                    {
                        "error": {
                            "code": "PASSWORD_CHANGE_REQUIRED",
                            "message": "Change the temporary password before accessing student features.",
                        }
                    }
                )

        # Extract impersonation claims if present
        if validated_token.get("impersonated", False):
            impersonated_by_id = validated_token.get("impersonated_by")
            if impersonated_by_id:
                # Attach to request for audit middleware
                request.impersonated_by_id = impersonated_by_id
                request.impersonation_jti = validated_token.get("impersonation_jti")

        return (user, validated_token)
