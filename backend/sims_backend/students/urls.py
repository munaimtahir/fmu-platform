from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StudentViewSet

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")

urlpatterns = [
    path("api/", include(router.urls)),
    path("", include("sims_backend.students.imports.urls")),
]

