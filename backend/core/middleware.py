"""
Core middleware for platform-wide functionality.
"""
from __future__ import annotations

import logging
from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class BlockLegacyWritesMiddleware:
    """
    Middleware to block write operations (POST, PUT, PATCH, DELETE) on legacy API endpoints.
    
    Legacy endpoints are those under /api/legacy/ prefix.
    Writes are blocked unless ALLOW_LEGACY_WRITES environment variable is set to True.
    
    This middleware should be placed after authentication middleware but before view dispatch.
    """

    WRITE_METHODS = ("POST", "PUT", "PATCH", "DELETE")
    LEGACY_PREFIX = "/api/legacy/"

    def __init__(self, get_response):
        self.get_response = get_response
        # Read settings once at initialization
        self.allow_legacy_writes = getattr(
            settings, "ALLOW_LEGACY_WRITES", False
        )

    def __call__(self, request):
        # Check if this is a write operation on a legacy endpoint
        if self._is_legacy_write(request):
            return self._block_legacy_write(request)
        
        return self.get_response(request)

    def _is_legacy_write(self, request) -> bool:
        """Check if this is a write operation on a legacy endpoint."""
        # Check if path starts with legacy prefix
        if not request.path.startswith(self.LEGACY_PREFIX):
            return False
        
        # Check if it's a write method
        if request.method.upper() not in self.WRITE_METHODS:
            return False
        
        return True

    def _block_legacy_write(self, request):
        """Return error response for blocked legacy write operations."""
        logger.warning(
            f"Blocked legacy write operation: {request.method} {request.path} "
            f"(ALLOW_LEGACY_WRITES={self.allow_legacy_writes})"
        )
        
        return JsonResponse(
            {
                "error": {
                    "code": "LEGACY_WRITES_DISABLED",
                    "message": "Legacy module writes are disabled.",
                    "details": {
                        "path": request.path,
                        "method": request.method,
                        "reason": "Legacy modules are deprecated. Use canonical modules instead.",
                        "documentation": "/docs/CANONICAL_MODULES.md",
                    },
                }
            },
            status=409,  # Conflict status code
        )
