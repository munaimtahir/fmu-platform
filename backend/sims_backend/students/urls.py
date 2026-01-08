from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeavePeriodViewSet, StudentViewSet

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")
router.register(r"leave-periods", LeavePeriodViewSet, basename="leave-period")

urlpatterns = [
    path("api/", include(router.urls)),
    path("", include("sims_backend.students.imports.urls")),
]

