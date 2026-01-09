"""URL routing for settings endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AppSettingViewSet

router = DefaultRouter()
router.register(r"settings", AppSettingViewSet, basename="settings")

urlpatterns = [
    path("api/admin/", include(router.urls)),
]
