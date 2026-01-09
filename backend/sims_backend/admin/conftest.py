"""Pytest fixtures for admin tests."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """API client fixture for tests."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Admin user fixture for tests."""
    user = User.objects.create_user(username="admin1", password="pass")
    user.is_superuser = True
    user.is_staff = True
    user.save()
    return user
