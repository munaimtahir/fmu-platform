"""URL routing for core app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    RoleViewSet,
    PermissionTaskViewSet,
    RoleTaskAssignmentViewSet,
    UserTaskAssignmentViewSet,
    UserMeViewSet,
)

router = DefaultRouter()
router.register(r"core/roles", RoleViewSet, basename="role")
router.register(r"core/permission-tasks", PermissionTaskViewSet, basename="permission-task")
router.register(r"core/role-task-assignments", RoleTaskAssignmentViewSet, basename="role-task-assignment")
router.register(r"core/user-task-assignments", UserTaskAssignmentViewSet, basename="user-task-assignment")
router.register(r"core/users/me", UserMeViewSet, basename="user-me")

urlpatterns = [
    path("api/", include(router.urls)),
]
