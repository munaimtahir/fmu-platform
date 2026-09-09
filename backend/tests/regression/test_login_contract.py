"""Regression coverage for the public login error contract."""

import pytest
from rest_framework import status


@pytest.mark.django_db
class TestLoginContract:
    def test_empty_json_is_a_validation_envelope(self, api_client):
        response = api_client.post("/api/auth/login/", {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"]["code"] == "AUTH_INVALID_CREDENTIALS"
        assert "request's data stream" not in response.data["error"]["message"]

    def test_malformed_json_is_a_validation_envelope(self, api_client):
        response = api_client.generic(
            "POST",
            "/api/auth/login/",
            data="{",
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data == {
            "error": {"code": "invalid_request", "message": "Invalid JSON request body."}
        }
