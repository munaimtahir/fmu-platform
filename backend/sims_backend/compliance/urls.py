from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentComplianceViewSet, AdminComplianceViewSet, RequirementDefinitionViewSet

router = DefaultRouter()
router.register(r'my-compliance', StudentComplianceViewSet, basename='my-compliance')
router.register(r'admin-compliance', AdminComplianceViewSet, basename='admin-compliance')
router.register(r'definitions', RequirementDefinitionViewSet, basename='requirement-definitions')

urlpatterns = [
    path('', include(router.urls)),
]
