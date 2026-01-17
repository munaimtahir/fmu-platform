from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sims_backend.notifications.views import NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('api/', include(router.urls)),
]
