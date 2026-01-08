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
    student_id = serializers.SerializerMethodField()
    
    def get_student_id(self, obj):
        """Get student ID if user has an associated student record."""
        try:
            if hasattr(obj, 'student') and obj.student:
                return obj.student.id
        except Exception:
            pass
        return None

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "student_id", "is_active"]
        read_only_fields = fields

    def get_full_name(self, obj):
        """Get user's full name."""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

    def get_role(self, obj):
        """Get user's primary role based on groups."""
        if obj.is_superuser:
            return "Admin"
        groups = list(obj.groups.values_list("name", flat=True))
        for role in ["Admin", "Registrar", "Finance", "ExamCell", "Faculty", "Student"]:
            if role in groups or role.upper() in groups:
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


# Core module serializers for RBAC system

class PermissionTaskSerializer(serializers.ModelSerializer):
    """Serializer for PermissionTask model."""
    
    class Meta:
        from core.models import PermissionTask
        model = PermissionTask
        fields = ["id", "code", "name", "description", "module", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model."""
    
    task_assignments = serializers.SerializerMethodField()
    
    class Meta:
        from core.models import Role
        model = Role
        fields = ["id", "name", "description", "is_system_role", "task_assignments", "created_at", "updated_at"]
        read_only_fields = ["id", "is_system_role", "created_at", "updated_at"]
    
    def get_task_assignments(self, obj):
        """Get list of permission tasks assigned to this role."""
        from core.models import RoleTaskAssignment
        assignments = RoleTaskAssignment.objects.filter(role=obj).select_related("task")
        return [
            {
                "id": a.id,
                "task": {
                    "id": a.task.id,
                    "code": a.task.code,
                    "name": a.task.name,
                },
                "created_at": a.created_at.isoformat(),
            }
            for a in assignments
        ]
    
    def validate_name(self, value):
        """Validate role name."""
        if self.instance and self.instance.is_system_role:
            if value != self.instance.name:
                raise serializers.ValidationError("Cannot rename system roles")
        return value


class RoleTaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for RoleTaskAssignment model."""
    
    role = RoleSerializer(read_only=True)
    task = PermissionTaskSerializer(read_only=True)
    role_id = serializers.IntegerField(write_only=True)
    task_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        from core.models import RoleTaskAssignment
        model = RoleTaskAssignment
        fields = ["id", "role", "task", "role_id", "task_id", "created_at", "updated_at"]
        read_only_fields = ["id", "role", "task", "created_at", "updated_at"]
    
    def create(self, validated_data):
        from core.models import Role, PermissionTask, RoleTaskAssignment
        role = Role.objects.get(id=validated_data.pop("role_id"))
        task = PermissionTask.objects.get(id=validated_data.pop("task_id"))
        return RoleTaskAssignment.objects.create(role=role, task=task)


class UserTaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for UserTaskAssignment model."""
    
    user = UserSerializer(read_only=True)
    task = PermissionTaskSerializer(read_only=True)
    granted_by = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    task_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        from core.models import UserTaskAssignment
        model = UserTaskAssignment
        fields = ["id", "user", "task", "granted_by", "user_id", "task_id", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "task", "granted_by", "created_at", "updated_at"]
    
    def create(self, validated_data):
        from core.models import PermissionTask, UserTaskAssignment
        user = User.objects.get(id=validated_data.pop("user_id"))
        task = PermissionTask.objects.get(id=validated_data.pop("task_id"))
        granted_by = self.context["request"].user
        return UserTaskAssignment.objects.create(user=user, task=task, granted_by=granted_by)


class UserMeSerializer(serializers.ModelSerializer):
    """Serializer for /api/core/users/me/ endpoint."""
    
    roles = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "roles", "tasks", "profile"]
        read_only_fields = fields
    
    def get_roles(self, obj):
        """Get user's roles."""
        from core.permissions import get_user_roles
        roles = get_user_roles(obj)
        return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]
    
    def get_tasks(self, obj):
        """Get user's permission tasks (both direct and via roles)."""
        from core.models import PermissionTask, UserTaskAssignment, RoleTaskAssignment, Role
        from core.permissions import get_user_roles
        
        # Direct assignments
        direct_tasks = UserTaskAssignment.objects.filter(user=obj).values_list("task__code", flat=True)
        
        # Role-based assignments
        user_roles = get_user_roles(obj)
        role_task_codes = RoleTaskAssignment.objects.filter(
            role__in=user_roles
        ).values_list("task__code", flat=True)
        
        # Combine and get unique tasks
        all_task_codes = set(direct_tasks) | set(role_task_codes)
        tasks = PermissionTask.objects.filter(code__in=all_task_codes)
        
        return [{"id": t.id, "code": t.code, "name": t.name, "module": t.module} for t in tasks]
    
    def get_profile(self, obj):
        """Get user's profile if exists."""
        if hasattr(obj, "profile"):
            return {
                "phone": obj.profile.phone,
                "date_of_birth": obj.profile.date_of_birth.isoformat() if obj.profile.date_of_birth else None,
            }
        return None
