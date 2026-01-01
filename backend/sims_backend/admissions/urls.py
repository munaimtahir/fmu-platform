from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationDraftViewSet,
    StudentApplicationViewSet,
    StudentViewSet,
)

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")
router.register(
    r"student-applications", StudentApplicationViewSet, basename="student-application"
)
router.register(
    r"application-drafts", ApplicationDraftViewSet, basename="application-draft"
)

urlpatterns = [
    path("api/", include(router.urls)),
]
