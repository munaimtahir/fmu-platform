from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sims_backend.learning.views import (
    LearningMaterialAudienceViewSet,
    LearningMaterialViewSet,
    LearningStudentFeedAPIView,
)

router = DefaultRouter()
router.register(r"learning/materials", LearningMaterialViewSet, basename="learning-materials")
router.register(r"learning/audiences", LearningMaterialAudienceViewSet, basename="learning-audiences")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/learning/student-feed/", LearningStudentFeedAPIView.as_view(), name="learning-student-feed"),
]
