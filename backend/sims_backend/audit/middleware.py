from __future__ import annotations

import logging
from collections.abc import Iterable

from django.utils import timezone

logger = logging.getLogger(__name__)


class WriteAuditMiddleware:
    """Persist an AuditLog entry for successful write requests."""

    WRITE_METHODS: Iterable[str] = ("POST", "PUT", "PATCH", "DELETE")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self._maybe_record(request, response)
        except Exception:  # pragma: no cover - audit failures must not break requests
            logger.exception("Failed to record audit log entry")
        return response

    def _maybe_record(self, request, response) -> None:
        method = request.method.upper()
        if method not in self.WRITE_METHODS:
            return
        status_code = getattr(response, "status_code", 500)
        if status_code >= 400:
            return

        from .models import AuditLog  # Local import to avoid AppRegistryNotReady

        resolver_match = getattr(request, "resolver_match", None)
        model_label = self._resolve_model_label(resolver_match)
        object_id = self._resolve_object_id(resolver_match, response)
        summary = self._build_summary(method, model_label, object_id, request.path)

        # Capture request data (excluding sensitive fields)
        request_data = {}
        try:
            if hasattr(request, 'data'):
                # DRF request
                request_data = dict(request.data)
            elif hasattr(request, 'POST'):
                # Django request
                request_data = dict(request.POST)
            elif hasattr(request, 'body'):
                # Try to parse JSON body
                import json
                try:
                    if request.body:
                        request_data = json.loads(request.body)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass

            # Remove sensitive fields
            sensitive_fields = ['password', 'token', 'secret', 'key']
            for field in sensitive_fields:
                request_data.pop(field, None)
                request_data.pop(f'{field}_confirmation', None)
        except Exception:
            request_data = {}

        AuditLog.objects.create(
            actor=(
                request.user
                if getattr(request, "user", None) and request.user.is_authenticated
                else None
            ),
            method=method,
            path=request.path,
            status_code=status_code,
            model=model_label,
            object_id=object_id,
            summary=summary,
            request_data=request_data,
            timestamp=timezone.now(),
        )

    @staticmethod
    def _resolve_model_label(resolver_match) -> str:
        if not resolver_match:
            return ""
        view_cls = getattr(resolver_match.func, "view_class", None) or getattr(
            resolver_match.func, "cls", None
        )
        queryset = getattr(view_cls, "queryset", None)
        if queryset is not None:
            model = getattr(queryset, "model", None)
            if model is not None:
                return str(model._meta.label)
        serializer_class = getattr(view_cls, "serializer_class", None)
        if serializer_class is not None:
            model = getattr(getattr(serializer_class, "Meta", None), "model", None)
            if model is not None:
                return str(model._meta.label)
        return ""

    @staticmethod
    def _resolve_object_id(resolver_match, response) -> str:
        if resolver_match and "pk" in resolver_match.kwargs:
            return str(resolver_match.kwargs["pk"])
        data = getattr(response, "data", None)
        if isinstance(data, dict):
            for key in ("id", "pk", "uuid"):
                if key in data and data[key] is not None:
                    return str(data[key])
        return ""

    @staticmethod
    def _build_summary(method: str, model_label: str, object_id: str, path: str) -> str:
        parts = [method]
        if model_label:
            parts.append(model_label)
        if object_id:
            parts.append(f"#{object_id}")
        if not model_label and not object_id:
            parts.append(path)
        return " ".join(parts)
