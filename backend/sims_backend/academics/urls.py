from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicPeriodViewSet,
    BatchViewSet,
    DepartmentViewSet,
    GroupViewSet,
    ProgramViewSet,
)

router = DefaultRouter()
router.register(r"programs", ProgramViewSet, basename="program")
router.register(r"batches", BatchViewSet, basename="batch")
router.register(r"academic-periods", AcademicPeriodViewSet, basename="academic-period")
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"departments", DepartmentViewSet, basename="department")

urlpatterns = [path("api/academics/", include(router.urls))]
