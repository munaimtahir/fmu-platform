"""Shared queue availability checks for APIs that enqueue background work."""

import django_rq
from rest_framework.exceptions import APIException


class AsyncUnavailableError(RuntimeError):
    pass


class AsyncServiceUnavailable(APIException):
    status_code = 503
    default_code = "ASYNC_UNAVAILABLE"
    default_detail = "Background processing is temporarily unavailable."


def default_queue():
    """Return a reachable RQ queue or raise a stable, caller-safe exception."""
    try:
        queue = django_rq.get_queue("default")
        queue.connection.ping()
        return queue
    except Exception as exc:  # connection errors vary by redis client/runtime
        raise AsyncUnavailableError("Background processing is temporarily unavailable.") from exc
