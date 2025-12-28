"""Tests for core exception handling."""

from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory

from core.exceptions import custom_exception_handler


class TestCustomExceptionHandler:
    """Test custom exception handler formatting."""

    def test_drf_exception_formatted(self):
        """Test that DRF exceptions are formatted correctly."""
        factory = APIRequestFactory()
        request = factory.get("/test/")
        context = {"request": request}

        exc = NotFound("Resource not found")
        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "error" in response.data
        assert response.data["error"]["code"] == status.HTTP_404_NOT_FOUND
        assert "not found" in response.data["error"]["message"].lower()
        assert "details" in response.data["error"]

    def test_permission_denied_formatted(self):
        """Test that permission denied exceptions are formatted."""
        factory = APIRequestFactory()
        request = factory.get("/test/")
        context = {"request": request}

        exc = PermissionDenied("You do not have permission")
        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["error"]["code"] == status.HTTP_403_FORBIDDEN
        assert "permission" in response.data["error"]["message"].lower()

    def test_validation_error_formatted(self):
        """Test that validation errors are formatted."""
        factory = APIRequestFactory()
        request = factory.get("/test/")
        context = {"request": request}

        exc = ValidationError({"field": "This field is required"})
        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        # Check the field error is in details
        assert "field" in response.data["error"]["details"]
        # The error message should contain the validation text
        assert "required" in str(response.data["error"]["details"]["field"]).lower()

    def test_non_drf_exception_returns_500(self):
        """Test that non-DRF exceptions return 500."""
        factory = APIRequestFactory()
        request = factory.get("/test/")
        context = {"request": request}

        # Standard Python exception that DRF doesn't handle
        exc = ValueError("Something went wrong")
        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.data["error"]["code"] == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "internal server error" in response.data["error"]["message"].lower()

    def test_exception_with_list_detail(self):
        """Test exception handling when detail is a list."""
        factory = APIRequestFactory()
        request = factory.get("/test/")
        context = {"request": request}

        exc = ValidationError(["Error 1", "Error 2"])
        response = custom_exception_handler(exc, context)

        assert response is not None
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        # Should handle list data appropriately
        assert "details" in response.data["error"]
