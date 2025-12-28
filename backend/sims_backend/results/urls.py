from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PendingChangeViewSet, ResultViewSet

router = DefaultRouter()
router.register(r"results", ResultViewSet, basename="result")
router.register(r"pending-changes", PendingChangeViewSet, basename="pending-change")
urlpatterns = [path("api/", include(router.urls))]
