"""URL routing for Faculty CSV import"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FacultyImportViewSet

router = DefaultRouter()
router.register(r'import', FacultyImportViewSet, basename='faculty-import')

urlpatterns = [
    path('api/admin/faculty/', include(router.urls)),
]
