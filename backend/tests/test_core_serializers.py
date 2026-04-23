import pytest
from core.serializers import UserSerializer, UserMeSerializer, RoleSerializer, PermissionTaskSerializer
from django.contrib.auth.models import Group, User
from core.models import Role, PermissionTask

@pytest.mark.django_db
class TestCoreSerializers:
    def test_user_serializer(self):
        user = User.objects.create_user(username="s1", email="s1@test.com")
        group, _ = Group.objects.get_or_create(name="STUDENT")
        user.groups.add(group)
        
        serializer = UserSerializer(user)
        data = serializer.data
        assert data["username"] == "s1"
        assert data["role"] == "Student"

    def test_user_me_serializer(self):
        user = User.objects.create_user(username="a1", first_name="Admin", last_name="User")
        group, _ = Group.objects.get_or_create(name="ADMIN")
        user.groups.add(group)
        
        serializer = UserMeSerializer(user)
        data = serializer.data
        assert data["first_name"] == "Admin"
        assert data["last_name"] == "User"
        assert data["is_active"] is True

    def test_role_serializer(self):
        role = Role.objects.create(name="Test Role")
        serializer = RoleSerializer(role)
        assert serializer.data["name"] == "Test Role"

    def test_permission_task_serializer(self):
        task = PermissionTask.objects.create(code="test.task", name="Test Task")
        serializer = PermissionTaskSerializer(task)
        assert serializer.data["code"] == "test.task"
