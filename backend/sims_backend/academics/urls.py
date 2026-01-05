from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicPeriodViewSet,
    BatchViewSet,
    DepartmentViewSet,
    GroupViewSet,
    LearningBlockViewSet,
    ModuleViewSet,
    PeriodViewSet,
    ProgramViewSet,
    TrackViewSet,
)

router = DefaultRouter()
router.register(r"programs", ProgramViewSet, basename="program")
router.register(r"batches", BatchViewSet, basename="batch")
router.register(r"academic-periods", AcademicPeriodViewSet, basename="academic-period")
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"departments", DepartmentViewSet, basename="department")
# New Academics Module endpoints
router.register(r"periods", PeriodViewSet, basename="period")
router.register(r"tracks", TrackViewSet, basename="track")
router.register(r"blocks", LearningBlockViewSet, basename="block")
router.register(r"modules", ModuleViewSet, basename="module")

urlpatterns = [path("api/academics/", include(router.urls))]
