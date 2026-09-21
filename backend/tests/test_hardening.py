"""Regression coverage for operational hardening controls."""

from unittest.mock import MagicMock, patch

import pytest
from django.test import Client, override_settings

from core.async_ops import AsyncUnavailableError, default_queue
from core.throttling import (
    LoginRateThrottle,
    PasswordChangeThrottle,
    RefreshRateThrottle,
    ResilientAnonRateThrottle,
    SensitiveActionThrottle,
)


def test_async_queue_requires_a_successful_redis_ping():
    queue = MagicMock()
    queue.connection.ping.return_value = True
    with patch("core.async_ops.django_rq.get_queue", return_value=queue):
        assert default_queue() is queue


def test_async_queue_has_a_stable_unavailable_error():
    with patch("core.async_ops.django_rq.get_queue", side_effect=OSError("redis unavailable")):
        with pytest.raises(AsyncUnavailableError, match="Background processing"):
            default_queue()


@override_settings(METRICS_TOKEN="metrics-test-token")
def test_metrics_requires_a_bearer_token():
    client = Client()
    assert client.get("/metrics").status_code == 403

    queue = MagicMock()
    queue.connection.ping.return_value = True
    queue.count = 3
    with patch("core.metrics.django_rq.get_queue", return_value=queue):
        response = client.get("/metrics", HTTP_AUTHORIZATION="Bearer metrics-test-token")

    assert response.status_code == 200
    assert b"medsims_http_request_duration_seconds" in response.content
    assert b"medsims_rq_available" in response.content


def test_sensitive_throttles_use_distinct_configured_scopes():
    assert LoginRateThrottle.scope == "login"
    assert RefreshRateThrottle.scope == "refresh"
    assert PasswordChangeThrottle.scope == "password_change"
    assert SensitiveActionThrottle.scope == "sensitive_action"


def test_anonymous_throttle_falls_back_when_shared_cache_is_unavailable():
    request = MagicMock()
    request.META = {"REMOTE_ADDR": "127.0.0.1"}
    throttle = ResilientAnonRateThrottle()
    failing_cache = MagicMock()
    failing_cache.get.side_effect = OSError("redis unavailable")
    throttle.cache = failing_cache

    assert throttle.allow_request(request, view=None) is True
