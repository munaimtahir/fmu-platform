"""Admin serializers."""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from sims_backend.students.models import Student

User = get_user_model()

MANAGED_ROLES = {
    "REGISTRAR": "Registrar",
    "COORDINATOR": "Coordinator",
    "EXAMCELL": "ExamCell",
    "FINANCE": "Finance",
    "FACULTY": "Faculty",
    "STUDENT": "Student",
    "OFFICE_ASSISTANT": "OfficeAssistant",
    "ADMIN": "Admin",
}


def _role_group(value):
    """Resolve an API role label without silently discarding invalid input."""
    normalized = str(value).strip().replace(" ", "_").upper()
    if normalized == "OFFICEASSISTANT":
        normalized = "OFFICE_ASSISTANT"
    normalized = next((key for key in MANAGED_ROLES if key.replace("_", "") == normalized.replace("_", "")), normalized)
    if normalized not in MANAGED_ROLES:
        raise serializers.ValidationError({"role": f"Unsupported role: {value}"})
    collapsed = normalized.replace("_", "")
    group = next((item for item in Group.objects.all() if item.name.upper().replace(" ", "").replace("_", "") == collapsed), None)
    if group is None:
        raise serializers.ValidationError({"role": f"Role group is not configured: {MANAGED_ROLES[normalized]}"})
    return group


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""

    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    groups_list = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "role",
            "groups_list",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "last_login", "date_joined"]

    def get_full_name(self, obj) -> str:
        """Get user's full name."""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

    def get_role(self, obj) -> str:
        """Get user's primary role."""
        if obj.is_superuser:
            return "Admin"
        groups = list(obj.groups.values_list("name", flat=True))
        upper_groups = {group.upper().replace(" ", "").replace("_", "") for group in groups}
        for group_name, label in MANAGED_ROLES.items():
            if group_name.replace("_", "") in upper_groups:
                return label
        return "User"

    @extend_schema_field(
        {
            "type": "array",
            "items": {"type": "string"},
            "description": "Get list of group names.",
        }
    )
    def get_groups_list(self, obj):
        """Get list of group names."""
        return list(obj.groups.values_list("name", flat=True))


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""

    password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_active",
            "role",
        ]

    def validate_role(self, value):
        group = _role_group(value)
        if group.name.upper() == "STUDENT":
            raise serializers.ValidationError("Student accounts must be created through student onboarding")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists() or Student.objects.filter(reg_no__iexact=value).exists():
            raise serializers.ValidationError("This username conflicts with an existing account or registration number")
        return value

    def create(self, validated_data):
        """Create user with password and role."""
        role = validated_data.pop("role", None)
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)

        # Assign role if provided
        if role:
            user.groups.add(_role_group(role))

        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users."""

    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
        ]

    def validate_role(self, value):
        group = _role_group(value)
        linked_student = hasattr(self.instance, "student")
        if linked_student and group.name.upper() != "STUDENT":
            raise serializers.ValidationError("A linked student must retain the Student role")
        if group.name.upper() == "STUDENT" and not linked_student:
            raise serializers.ValidationError("Student role requires a linked student provisioned through onboarding")
        return value

    def validate_username(self, value):
        if hasattr(self.instance, "student") and value != self.instance.username:
            raise serializers.ValidationError("A linked student's username is immutable")
        if User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("This username is already in use")
        return value

    def validate(self, attrs):
        if hasattr(self.instance, "student"):
            forbidden = {"email", "first_name", "last_name"}.intersection(attrs)
            if forbidden:
                raise serializers.ValidationError(
                    {field: "Use the student profile correction action" for field in forbidden}
                )
        return attrs

    def update(self, instance, validated_data):
        """Update user and role."""
        role = validated_data.pop("role", None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update role if provided
        if role is not None:
            group = _role_group(role)
            instance.groups.set([group])

        return instance
