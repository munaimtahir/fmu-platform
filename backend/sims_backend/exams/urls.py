from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExamViewSet, ExamComponentViewSet

router = DefaultRouter()
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"exam-components", ExamComponentViewSet, basename="exam-component")

urlpatterns = [path("api/", include(router.urls))]

