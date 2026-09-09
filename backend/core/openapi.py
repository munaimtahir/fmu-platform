"""drf-spectacular extensions for MedSIMS' public API contract."""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class ImpersonationJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Document the custom JWT subclass as a standard bearer token scheme."""

    target_class = "sims_backend.admin.authentication.ImpersonationJWTAuthentication"
    name = "ImpersonationJWTAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT bearer token. Impersonation claims, when present, are audited server-side.",
        }
