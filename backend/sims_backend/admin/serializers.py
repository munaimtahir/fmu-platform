"""Admin serializers."""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

User = get_user_model()


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
    
    def get_full_name(self, obj):
        """Get user's full name."""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_role(self, obj):
        """Get user's primary role."""
        if obj.is_superuser:
            return "Admin"
        groups = list(obj.groups.values_list("name", flat=True))
        for role in ["ADMIN", "Admin", "Registrar", "Finance", "ExamCell", "Faculty", "Student"]:
            if role in groups or role.upper() in groups:
                return role
        return "User"
    
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
    
    def create(self, validated_data):
        """Create user with password and role."""
        role = validated_data.pop("role", None)
        password = validated_data.pop("password")
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # Assign role if provided
        if role:
            try:
                group = Group.objects.get(name=role.upper())
                user.groups.add(group)
            except Group.DoesNotExist:
                pass  # Role group doesn't exist, skip
        
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
    
    def update(self, instance, validated_data):
        """Update user and role."""
        role = validated_data.pop("role", None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update role if provided
        if role is not None:
            # Remove all groups
            instance.groups.clear()
            # Add new role group
            try:
                group = Group.objects.get(name=role.upper())
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
        
        return instance
