"""URL routing for admin endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminUserViewSet, admin_dashboard

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("api/admin/dashboard/", admin_dashboard, name="admin-dashboard"),
    path("api/admin/", include(router.urls)),
]
