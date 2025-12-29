from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ResultHeaderViewSet, ResultComponentEntryViewSet

router = DefaultRouter()
router.register(r"results", ResultHeaderViewSet, basename="result-header")
router.register(r"result-components", ResultComponentEntryViewSet, basename="result-component")

urlpatterns = [path("api/", include(router.urls))]
