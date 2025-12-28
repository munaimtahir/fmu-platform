from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet, ProgramViewSet, SectionViewSet, TermViewSet

router = DefaultRouter()
router.register(r"terms", TermViewSet, basename="term")
router.register(r"programs", ProgramViewSet, basename="program")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"sections", SectionViewSet, basename="section")

urlpatterns = [path("api/", include(router.urls))]
