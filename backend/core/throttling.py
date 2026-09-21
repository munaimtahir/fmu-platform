"""Rate-limit classes shared by security-sensitive API endpoints."""

from django.core.cache.backends.locmem import LocMemCache
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

# Redis is the authoritative store in normal operation.  This deliberately
# process-local fallback prevents an otherwise healthy API from becoming a 500
# factory when Redis is being restarted.  It does not attempt to make limits
# globally consistent during that short degraded period.
_FALLBACK_THROTTLE_CACHE = LocMemCache("medsims-throttle-fallback", {})


class ResilientThrottleMixin:
    """Use a local counter if the shared cache is temporarily unavailable."""

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            original_cache = self.cache
            self.cache = _FALLBACK_THROTTLE_CACHE
            try:
                return super().allow_request(request, view)
            finally:
                self.cache = original_cache


class ResilientAnonRateThrottle(ResilientThrottleMixin, AnonRateThrottle):
    """Anonymous throttle that preserves API availability during Redis outages."""


class ResilientUserRateThrottle(ResilientThrottleMixin, UserRateThrottle):
    """User throttle that preserves API availability during Redis outages."""


class LoginRateThrottle(ResilientAnonRateThrottle):
    scope = "login"


class RefreshRateThrottle(ResilientAnonRateThrottle):
    scope = "refresh"


class PasswordChangeThrottle(ResilientUserRateThrottle):
    scope = "password_change"


class SensitiveActionThrottle(ResilientUserRateThrottle):
    """Throttle queueing, bulk import, biometric and other costly mutations."""

    scope = "sensitive_action"
