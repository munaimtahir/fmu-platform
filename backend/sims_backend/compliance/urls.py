from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminComplianceViewSet,
    RequirementDefinitionViewSet,
    RequirementScopeViewSet,
    StudentComplianceViewSet,
)

router = DefaultRouter()
router.register(r"my-compliance", StudentComplianceViewSet, basename="my-compliance")
router.register(r"admin-compliance", AdminComplianceViewSet, basename="admin-compliance")
router.register(r"definitions", RequirementDefinitionViewSet, basename="requirement-definitions")
router.register(r"requirement-scopes", RequirementScopeViewSet, basename="requirement-scopes")

urlpatterns = [
    path("", include(router.urls)),
]
