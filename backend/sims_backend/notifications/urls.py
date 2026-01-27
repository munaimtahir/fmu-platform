from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sims_backend.notifications.views import NotificationAdminViewSet, NotificationInboxViewSet

router = DefaultRouter()
router.register(r"notifications", NotificationAdminViewSet, basename="notifications")
router.register(r"my/notifications", NotificationInboxViewSet, basename="my-notifications")

urlpatterns = [
    path("api/", include(router.urls)),
]
