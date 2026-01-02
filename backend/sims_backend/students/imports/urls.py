"""URL routing for Student CSV import"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StudentImportViewSet

router = DefaultRouter()
router.register(r'import', StudentImportViewSet, basename='student-import')

urlpatterns = [
    path('api/admin/students/', include(router.urls)),
]
