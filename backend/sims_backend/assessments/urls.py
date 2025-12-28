from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssessmentScoreViewSet, AssessmentViewSet

router = DefaultRouter()
router.register(r"assessments", AssessmentViewSet, basename="assessment")
router.register(
    r"assessment-scores", AssessmentScoreViewSet, basename="assessmentscore"
)
urlpatterns = [path("api/", include(router.urls))]
