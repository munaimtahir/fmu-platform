"""Low-cardinality Prometheus metrics for the Django application."""

from __future__ import annotations

import hmac
import time

import django_rq
from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from prometheus_client import CONTENT_TYPE_LATEST, Gauge, Histogram, generate_latest

HTTP_REQUESTS = Histogram(
    "medsims_http_request_duration_seconds",
    "HTTP request duration by resolved route, method and status.",
    ("route", "method", "status"),
)
RQ_QUEUE_DEPTH = Gauge("medsims_rq_queue_depth", "Jobs waiting in the default RQ queue.")
RQ_AVAILABLE = Gauge("medsims_rq_available", "Whether the default RQ queue is reachable.")


def _route_name(request) -> str:
    match = getattr(request, "resolver_match", None)
    return getattr(match, "view_name", None) or "unresolved"


class MetricsMiddleware(MiddlewareMixin):
    """Measure requests without recording identifiers, paths, users or tokens."""

    def process_request(self, request):
        request._metrics_started_at = time.monotonic()

    def process_response(self, request, response):
        started_at = getattr(request, "_metrics_started_at", None)
        if started_at is not None and request.path != "/metrics":
            HTTP_REQUESTS.labels(
                route=_route_name(request), method=request.method, status=str(response.status_code)
            ).observe(time.monotonic() - started_at)
        return response


def metrics_view(request):
    """Serve scrape metrics only to callers with the deployment bearer token."""
    expected_token = settings.METRICS_TOKEN
    authorization = request.headers.get("Authorization", "")
    supplied_token = authorization.removeprefix("Bearer ") if authorization.startswith("Bearer ") else ""
    if not expected_token or not hmac.compare_digest(supplied_token, expected_token):
        return HttpResponseForbidden("Metrics access denied.")

    try:
        queue = django_rq.get_queue("default")
        queue.connection.ping()
        RQ_AVAILABLE.set(1)
        RQ_QUEUE_DEPTH.set(queue.count)
    except Exception:
        RQ_AVAILABLE.set(0)
        RQ_QUEUE_DEPTH.set(0)

    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
