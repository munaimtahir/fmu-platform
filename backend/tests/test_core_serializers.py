import pytest
from django.contrib.auth.models import Group, User

from core.models import PermissionTask, Role
from core.serializers import PermissionTaskSerializer, RoleSerializer, UserMeSerializer, UserSerializer


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

    @pytest.mark.parametrize(
        "group_name,expected_role",
        [
            ("COORDINATOR", "Coordinator"),
            ("Coordinator", "Coordinator"),
            ("OFFICE_ASSISTANT", "OfficeAssistant"),
            ("EXAMCELL", "ExamCell"),
            ("REGISTRAR", "Registrar"),
            ("FINANCE", "Finance"),
            ("FACULTY", "Faculty"),
        ],
    )
    def test_user_serializer_role_for_all_role_groups(self, group_name, expected_role):
        user = User.objects.create_user(username=f"u_{group_name.lower()}", email=f"{group_name.lower()}@test.com")
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)

        data = UserSerializer(user).data
        assert data["role"] == expected_role

    def test_user_serializer_role_falls_back_to_user_for_unknown_group(self):
        user = User.objects.create_user(username="no_role", email="no_role@test.com")
        group, _ = Group.objects.get_or_create(name="SOME_UNRELATED_GROUP")
        user.groups.add(group)

        data = UserSerializer(user).data
        assert data["role"] == "User"

    def test_user_serializer_role_superuser_is_admin_regardless_of_groups(self):
        user = User.objects.create_superuser(username="super1", email="super1@test.com", password="x")
        group, _ = Group.objects.get_or_create(name="STUDENT")
        user.groups.add(group)

        data = UserSerializer(user).data
        assert data["role"] == "Admin"

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
