from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationPreferenceViewSet,
    NotificationTemplateViewSet,
    NotificationViewSet,
)

router = DefaultRouter()
router.register(r"templates", NotificationTemplateViewSet, basename="notification-template")
router.register(r"messages", NotificationViewSet, basename="notification")
router.register(r"preferences", NotificationPreferenceViewSet, basename="notification-preference")

urlpatterns = [
    path("api/", router.urls),
]
