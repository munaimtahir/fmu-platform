"""Custom JWT authentication that extracts impersonation claims."""
from rest_framework_simplejwt.authentication import JWTAuthentication


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

        # Extract impersonation claims if present
        if validated_token.get('impersonated', False):
            impersonated_by_id = validated_token.get('impersonated_by')
            if impersonated_by_id:
                # Attach to request for audit middleware
                request.impersonated_by_id = impersonated_by_id
                request.impersonation_jti = validated_token.get('impersonation_jti')

        return (user, validated_token)
