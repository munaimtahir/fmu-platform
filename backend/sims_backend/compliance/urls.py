from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminComplianceViewSet, RequirementDefinitionViewSet, StudentComplianceViewSet

router = DefaultRouter()
router.register(r"my-compliance", StudentComplianceViewSet, basename="my-compliance")
router.register(r"admin-compliance", AdminComplianceViewSet, basename="admin-compliance")
router.register(r"definitions", RequirementDefinitionViewSet, basename="requirement-definitions")

urlpatterns = [
    path("", include(router.urls)),
]
