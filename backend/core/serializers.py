"""Custom serializers for authentication.

This module provides unified authentication serializers that support login
via either username or email using a single `identifier` field.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


# Error codes for authentication
AUTH_ERROR_CODES = {
    "invalid_credentials": "AUTH_INVALID_CREDENTIALS",
    "inactive_account": "AUTH_INACTIVE_ACCOUNT",
    "account_locked": "AUTH_ACCOUNT_LOCKED",
    "token_invalid": "AUTH_TOKEN_INVALID",
    "token_expired": "AUTH_TOKEN_EXPIRED",
}


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information in auth responses."""

    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "is_active"]
        read_only_fields = fields

    def get_full_name(self, obj):
        """Get user's full name."""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

    def get_role(self, obj):
        """Get user's primary role based on groups."""
        if obj.is_superuser:
            return "Admin"
        # Check group memberships
        groups = obj.groups.values_list("name", flat=True)
        # Return first matching role in priority order
        for role in ["Admin", "Registrar", "ExamCell", "Faculty", "Student"]:
            if role in groups:
                return role
        return "User"


class UnifiedLoginSerializer(serializers.Serializer):
    """
    Unified login serializer that accepts identifier (email OR username) and password.

    This serializer implements the canonical auth contract:
    - Request: { "identifier": "user@example.com or username", "password": "..." }
    - Response: { "user": {...}, "tokens": {"access": "...", "refresh": "..."} }
    """

    identifier = serializers.CharField(
        required=True,
        help_text="Username or email address",
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        """
        Validate credentials and return user with tokens.

        Looks up user by either username or email using the identifier field.
        """
        identifier = attrs.get("identifier", "").strip()
        password = attrs.get("password", "")

        if not identifier or not password:
            raise serializers.ValidationError(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["invalid_credentials"],
                        "message": "Both identifier and password are required.",
                    }
                }
            )

        # Try to find user by username OR email
        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

        if user is None:
            raise serializers.ValidationError(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["invalid_credentials"],
                        "message": "Invalid username/email or password.",
                    }
                }
            )

        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["invalid_credentials"],
                        "message": "Invalid username/email or password.",
                    }
                }
            )

        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["inactive_account"],
                        "message": "This account is inactive.",
                    }
                }
            )

        # Update last login
        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        attrs["user"] = user
        attrs["tokens"] = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

        return attrs


class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for token refresh endpoint."""

    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        """Validate refresh token and return new access token."""
        refresh_token = attrs.get("refresh")

        try:
            refresh = RefreshToken(refresh_token)
            data = {
                "access": str(refresh.access_token),
            }

            # If rotation is enabled, also return new refresh token
            if api_settings.ROTATE_REFRESH_TOKENS:
                refresh.set_jti()
                refresh.set_exp()
                data["refresh"] = str(refresh)

            return data
        except Exception:
            raise serializers.ValidationError(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["token_invalid"],
                        "message": "Invalid or expired refresh token.",
                    }
                }
            )


# Legacy serializer for backward compatibility (deprecated)
class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    DEPRECATED: Use UnifiedLoginSerializer instead.

    A custom token obtain pair serializer that uses email instead of username.
    Kept for backward compatibility during transition period.
    """

    username_field = "email"

    def validate(self, attrs):
        """
        Validates the user's credentials and generates JWT tokens.
        """
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            # Find user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise AuthenticationFailed(
                    "No active account found with the given credentials"
                )

            # Check password
            if not user.check_password(password):
                raise AuthenticationFailed(
                    "No active account found with the given credentials"
                )

            # Check if user is active
            if not user.is_active:
                raise AuthenticationFailed(
                    "No active account found with the given credentials"
                )

            # Update last login
            if api_settings.UPDATE_LAST_LOGIN:
                update_last_login(None, user)

            # Generate tokens
            refresh = self.get_token(user)

            data = {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }

            return data
        else:
            raise AuthenticationFailed("Must include 'email' and 'password'.")
