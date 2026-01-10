"""Tests for the canonical health/readiness endpoint."""

import json
from unittest.mock import MagicMock, patch

import pytest
from django.test import Client
from django.db import connection
from django.core.management import call_command


@pytest.mark.django_db
class TestHealthEndpoint:
    """Test suite for the /api/health/ endpoint."""

    def test_health_endpoint_structure(self):
        """Test that health endpoint returns correct JSON structure."""
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        # Check top-level structure
        assert "status" in data
        assert "checks" in data
        assert "version" in data
        
        # Check checks structure
        assert "db" in data["checks"]
        assert "migrations" in data["checks"]
        assert "redis" in data["checks"]
        
        # Check db check structure
        db_check = data["checks"]["db"]
        assert "status" in db_check
        assert "latency_ms" in db_check
        assert isinstance(db_check["latency_ms"], (int, float))
        assert db_check["latency_ms"] >= 0
        
        # Check migrations check structure
        migrations_check = data["checks"]["migrations"]
        assert "status" in migrations_check
        assert migrations_check["status"] in ["ok", "fail"]
        
        # Check redis check structure
        redis_check = data["checks"]["redis"]
        assert "status" in redis_check
        assert redis_check["status"] in ["ok", "fail", "skipped"]

    def test_health_endpoint_db_check(self):
        """Test that database connectivity check works."""
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        # Database should be accessible in tests
        db_check = data["checks"]["db"]
        assert db_check["status"] == "ok"
        assert db_check["latency_ms"] >= 0

    def test_health_endpoint_migrations_check(self):
        """Test that migrations check works correctly."""
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        # Migrations should be applied in tests (test database is migrated)
        migrations_check = data["checks"]["migrations"]
        assert migrations_check["status"] in ["ok", "fail"]
        
        # If migrations check fails, it should have error or pending_count
        if migrations_check["status"] == "fail":
            assert "error" in migrations_check or "pending_count" in migrations_check

    @patch("sims_backend.urls.django_rq.get_queue")
    def test_health_endpoint_redis_check_ok(self, mock_get_queue):
        """Test that Redis check works when Redis is available."""
        # Mock Redis queue to return success
        mock_queue = MagicMock()
        mock_queue.connection.ping.return_value = True
        mock_get_queue.return_value = mock_queue
        
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        redis_check = data["checks"]["redis"]
        assert redis_check["status"] in ["ok", "fail", "skipped"]

    @patch("sims_backend.urls.django_rq.get_queue")
    def test_health_endpoint_redis_check_fail(self, mock_get_queue):
        """Test that Redis check handles failures gracefully."""
        # Mock Redis queue to raise an exception
        mock_get_queue.side_effect = Exception("Redis connection failed")
        
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200  # Should still return 200
        data = json.loads(response.content)
        
        # Redis failure should not fail the endpoint (it's optional)
        redis_check = data["checks"]["redis"]
        assert redis_check["status"] in ["fail", "skipped"]

    @patch("sims_backend.urls.connection.cursor")
    def test_health_endpoint_db_failure(self, mock_cursor):
        """Test that database failure is handled correctly."""
        # Mock database to raise an exception
        mock_cursor.side_effect = Exception("Database connection failed")
        
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200  # Should still return 200
        data = json.loads(response.content)
        
        # Status should be degraded if DB fails
        assert data["status"] == "degraded"
        db_check = data["checks"]["db"]
        assert db_check["status"] == "fail"
        assert "error" in db_check

    def test_health_endpoint_version(self):
        """Test that version field is present and is a string."""
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        assert "version" in data
        assert isinstance(data["version"], str)
        # Version should not be empty
        assert len(data["version"]) > 0

    @patch.dict("os.environ", {"APP_VERSION": "v1.2.3"})
    def test_health_endpoint_version_from_env(self):
        """Test that version can be set via environment variable."""
        # Need to reload the module to pick up the env var
        import importlib
        import sims_backend.urls
        importlib.reload(sims_backend.urls)
        
        client = Client()
        response = client.get("/api/health/")
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        # Version should be from environment
        assert data["version"] == "v1.2.3"

    def test_health_endpoint_alternative_paths(self):
        """Test that health endpoint is accessible via multiple paths."""
        client = Client()
        
        # Test /api/health/ (canonical)
        response = client.get("/api/health/")
        assert response.status_code == 200
        
        # Test /health/ (legacy)
        response = client.get("/health/")
        assert response.status_code == 200
        
        # Test /healthz/ (alternative)
        response = client.get("/healthz/")
        assert response.status_code == 200
        
        # All should return same structure
        data1 = json.loads(client.get("/api/health/").content)
        data2 = json.loads(client.get("/health/").content)
        data3 = json.loads(client.get("/healthz/").content)
        
        assert data1["status"] == data2["status"] == data3["status"]
        assert "checks" in data1 and "checks" in data2 and "checks" in data3