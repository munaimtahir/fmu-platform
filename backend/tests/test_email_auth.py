"""Tests for authentication endpoints - unified and legacy."""

import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_with_email():
    """Create a test user with an email address."""
    user = User.objects.create_user(
        username="testuser", email="test@example.com", password="testpass123"
    )
    return user


@pytest.fixture
def user_with_role():
    """Create a test user with a role."""
    user = User.objects.create_user(
        username="facultyuser",
        email="faculty@example.com",
        password="testpass123",
        first_name="John",
        last_name="Doe",
    )
    faculty_group, _ = Group.objects.get_or_create(name="Faculty")
    user.groups.add(faculty_group)
    return user


# ==============================================================================
# NEW UNIFIED AUTH TESTS - /api/auth/login
# ==============================================================================


class TestUnifiedLogin:
    """Tests for the new unified login endpoint."""

    def test_login_with_username_success(self, user_with_email):
        """Test that users can login with username and password."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "testuser", "password": "testpass123"},
        )

        assert response.status_code == 200
        assert "user" in response.data
        assert "tokens" in response.data
        assert "access" in response.data["tokens"]
        assert "refresh" in response.data["tokens"]
        assert response.data["user"]["username"] == "testuser"
        assert response.data["user"]["email"] == "test@example.com"

    def test_login_with_email_success(self, user_with_email):
        """Test that users can login with email and password."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "test@example.com", "password": "testpass123"},
        )

        assert response.status_code == 200
        assert "user" in response.data
        assert "tokens" in response.data
        assert response.data["user"]["username"] == "testuser"

    def test_login_returns_user_info(self, user_with_role):
        """Test that login returns correct user information including role."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "facultyuser", "password": "testpass123"},
        )

        assert response.status_code == 200
        user_data = response.data["user"]
        assert user_data["id"] == user_with_role.id
        assert user_data["username"] == "facultyuser"
        assert user_data["email"] == "faculty@example.com"
        assert user_data["full_name"] == "John Doe"
        assert user_data["role"] == "Faculty"
        assert user_data["is_active"] is True

    def test_login_wrong_password(self, user_with_email):
        """Test that login fails with wrong password."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "testuser", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "error" in response.data
        assert response.data["error"]["code"] == "AUTH_INVALID_CREDENTIALS"

    def test_login_nonexistent_user(self):
        """Test that login fails with non-existent user."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "nonexistent", "password": "testpass123"},
        )

        assert response.status_code == 401
        assert "error" in response.data
        assert response.data["error"]["code"] == "AUTH_INVALID_CREDENTIALS"

    def test_login_inactive_user(self, user_with_email):
        """Test that login fails for inactive users."""
        user_with_email.is_active = False
        user_with_email.save()

        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "testuser", "password": "testpass123"},
        )

        assert response.status_code == 401
        assert "error" in response.data
        assert response.data["error"]["code"] == "AUTH_INACTIVE_ACCOUNT"

    def test_login_missing_identifier(self):
        """Test that login fails when identifier is missing."""
        client = APIClient()

        response = client.post("/api/auth/login/", {"password": "testpass123"})

        assert response.status_code == 400

    def test_login_missing_password(self, user_with_email):
        """Test that login fails when password is missing."""
        client = APIClient()

        response = client.post("/api/auth/login/", {"identifier": "testuser"})

        assert response.status_code == 400

    def test_login_empty_credentials(self):
        """Test that login fails with empty credentials."""
        client = APIClient()

        response = client.post("/api/auth/login/", {})

        assert response.status_code == 400

    def test_login_case_insensitive_email(self, user_with_email):
        """Test that email login is case-insensitive."""
        client = APIClient()

        response = client.post(
            "/api/auth/login/",
            {"identifier": "TEST@EXAMPLE.COM", "password": "testpass123"},
        )

        assert response.status_code == 200
        assert response.data["user"]["username"] == "testuser"


# ==============================================================================
# /api/auth/me TESTS
# ==============================================================================


class TestMeEndpoint:
    """Tests for the /api/auth/me endpoint."""

    def test_me_authenticated(self, user_with_role):
        """Test that /me returns user info for authenticated users."""
        client = APIClient()

        # Login first
        login_response = client.post(
            "/api/auth/login/",
            {"identifier": "facultyuser", "password": "testpass123"},
        )
        access_token = login_response.data["tokens"]["access"]

        # Call /me
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = client.get("/api/auth/me/")

        assert response.status_code == 200
        assert response.data["username"] == "facultyuser"
        assert response.data["email"] == "faculty@example.com"
        assert response.data["role"] == "Faculty"

    def test_me_unauthenticated(self):
        """Test that /me returns 401 for unauthenticated users."""
        client = APIClient()

        response = client.get("/api/auth/me/")

        assert response.status_code == 401


# ==============================================================================
# /api/auth/logout TESTS
# ==============================================================================


class TestLogoutEndpoint:
    """Tests for the /api/auth/logout endpoint."""

    def test_logout_authenticated(self, user_with_email):
        """Test that logout works for authenticated users."""
        client = APIClient()

        # Login first
        login_response = client.post(
            "/api/auth/login/",
            {"identifier": "testuser", "password": "testpass123"},
        )
        access_token = login_response.data["tokens"]["access"]
        refresh_token = login_response.data["tokens"]["refresh"]

        # Logout
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = client.post("/api/auth/logout/", {"refresh": refresh_token})

        assert response.status_code == 200
        assert response.data["success"] is True

    def test_logout_unauthenticated(self):
        """Test that logout returns 401 for unauthenticated users."""
        client = APIClient()

        response = client.post("/api/auth/logout/")

        assert response.status_code == 401


# ==============================================================================
# /api/auth/refresh TESTS
# ==============================================================================


class TestTokenRefreshEndpoint:
    """Tests for the /api/auth/refresh endpoint."""

    def test_refresh_valid_token(self, user_with_email):
        """Test that refresh works with a valid refresh token."""
        client = APIClient()

        # Login first
        login_response = client.post(
            "/api/auth/login/",
            {"identifier": "testuser", "password": "testpass123"},
        )
        refresh_token = login_response.data["tokens"]["refresh"]

        # Refresh
        response = client.post("/api/auth/refresh/", {"refresh": refresh_token})

        assert response.status_code == 200
        assert "access" in response.data

    def test_refresh_invalid_token(self):
        """Test that refresh fails with an invalid token."""
        client = APIClient()

        response = client.post("/api/auth/refresh/", {"refresh": "invalid_token"})

        assert response.status_code == 401
        assert "error" in response.data
        assert response.data["error"]["code"] == "AUTH_TOKEN_INVALID"

    def test_refresh_missing_token(self):
        """Test that refresh fails when token is missing."""
        client = APIClient()

        response = client.post("/api/auth/refresh/", {})

        assert response.status_code == 401


# ==============================================================================
# LEGACY AUTH TESTS - /api/auth/token/ (for backward compatibility)
# ==============================================================================


def test_legacy_login_with_email_success(user_with_email):
    """Test that legacy endpoint still works with email and password."""
    client = APIClient()

    response = client.post(
        "/api/auth/token/", {"email": "test@example.com", "password": "testpass123"}
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


def test_legacy_login_with_email_wrong_password(user_with_email):
    """Test that legacy login fails with wrong password."""
    client = APIClient()

    response = client.post(
        "/api/auth/token/", {"email": "test@example.com", "password": "wrongpassword"}
    )

    assert response.status_code == 401


def test_legacy_login_with_nonexistent_email():
    """Test that legacy login fails with non-existent email."""
    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {"email": "nonexistent@example.com", "password": "testpass123"},
    )

    assert response.status_code == 401


def test_legacy_login_with_inactive_user(user_with_email):
    """Test that legacy login fails for inactive users."""
    user_with_email.is_active = False
    user_with_email.save()

    client = APIClient()

    response = client.post(
        "/api/auth/token/", {"email": "test@example.com", "password": "testpass123"}
    )

    assert response.status_code == 401


def test_legacy_login_missing_email():
    """Test that legacy login fails when email is missing."""
    client = APIClient()

    response = client.post("/api/auth/token/", {"password": "testpass123"})

    assert response.status_code == 400


def test_legacy_login_missing_password(user_with_email):
    """Test that legacy login fails when password is missing."""
    client = APIClient()

    response = client.post("/api/auth/token/", {"email": "test@example.com"})

    assert response.status_code == 400


def test_legacy_login_empty_credentials():
    """Test that legacy login fails with empty credentials."""
    client = APIClient()

    response = client.post("/api/auth/token/", {})

    assert response.status_code == 400
