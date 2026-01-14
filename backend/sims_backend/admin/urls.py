"""URL routing for admin endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminUserViewSet, admin_dashboard
from .impersonation_views import start_impersonation, stop_impersonation

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("api/admin/dashboard/", admin_dashboard, name="admin-dashboard"),
    path(
        "api/admin/impersonation/start/",
        start_impersonation,
        name="impersonation-start"
    ),
    path(
        "api/admin/impersonation/stop/",
        stop_impersonation,
        name="impersonation-stop"
    ),
    path("api/admin/", include(router.urls)),
]
