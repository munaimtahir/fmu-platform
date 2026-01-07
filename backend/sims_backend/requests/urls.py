"""URL routing for requests module."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RequestViewSet,
    RequestTypeViewSet,
    RequestAttachmentViewSet,
    RequestRemarkViewSet,
)

router = DefaultRouter()
router.register(r"requests/types", RequestTypeViewSet, basename="request-type")
router.register(r"requests", RequestViewSet, basename="request")
router.register(r"request-attachments", RequestAttachmentViewSet, basename="request-attachment")
router.register(r"request-remarks", RequestRemarkViewSet, basename="request-remark")

urlpatterns = [
    path("api/", include(router.urls)),
]
