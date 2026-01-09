"""URL routing for syllabus endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SyllabusItemViewSet

router = DefaultRouter()
router.register(r"syllabus", SyllabusItemViewSet, basename="syllabus")

urlpatterns = [
    path("api/admin/", include(router.urls)),
]
