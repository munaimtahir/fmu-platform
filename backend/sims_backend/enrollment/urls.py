from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EnrollmentViewSet, enroll_in_section

router = DefaultRouter()
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path(
        "api/sections/<int:section_id>/enroll/",
        enroll_in_section,
        name="enroll_in_section",
    ),
    path("api/", include(router.urls)),
]
