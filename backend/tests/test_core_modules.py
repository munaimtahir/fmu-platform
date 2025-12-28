import time

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.settings import api_settings

from core.exceptions import custom_exception_handler
from core.serializers import EmailTokenObtainPairSerializer
from sims_backend.academics.models import Program

User = get_user_model()


@pytest.mark.django_db
def test_custom_exception_handler_formats_drf_response():
    response = custom_exception_handler(ValidationError({"field": ["error"]}), {})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["error"]["details"] == {"field": ["error"]}


def test_custom_exception_handler_handles_generic_exception():
    response = custom_exception_handler(RuntimeError("boom"), {})
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.data["error"]["message"] == "Internal server error"


@pytest.mark.django_db
def test_timestamped_model_touch_updates_timestamp(monkeypatch):
    program = Program.objects.create(name="History")
    original_updated = program.updated_at
    time.sleep(0.01)
    program.touch()
    program.refresh_from_db()
    assert program.updated_at > original_updated

    # Ensure the branch that forwards explicit update_fields is exercised
    program.name = "History Updated"
    time.sleep(0.01)
    program.touch(update_fields={"name", "updated_at"})
    program.refresh_from_db()
    assert program.name == "History Updated"
    assert program.updated_at > original_updated


@pytest.mark.django_db
def test_email_token_obtain_pair_serializer_success(monkeypatch):
    _ = User.objects.create_user(
        username="token-user", email="token@example.com", password="secret123"
    )
    monkeypatch.setattr(api_settings, "UPDATE_LAST_LOGIN", True)
    serializer = EmailTokenObtainPairSerializer(
        data={"email": "token@example.com", "password": "secret123"}
    )
    assert serializer.is_valid(), serializer.errors
    tokens = serializer.validated_data
    assert {"access", "refresh"}.issubset(tokens.keys())


@pytest.mark.django_db
def test_email_token_obtain_pair_serializer_rejects_invalid_password():
    User.objects.create_user(
        username="token-user2", email="token2@example.com", password="secret123"
    )
    serializer = EmailTokenObtainPairSerializer(
        data={"email": "token2@example.com", "password": "wrong"}
    )
    with pytest.raises(AuthenticationFailed):
        serializer.is_valid(raise_exception=True)


def test_email_token_obtain_pair_serializer_requires_fields():
    serializer = EmailTokenObtainPairSerializer()
    with pytest.raises(AuthenticationFailed):
        serializer.validate({})
