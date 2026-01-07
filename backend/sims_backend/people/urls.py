"""URL routing for people module."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PersonViewSet,
    ContactInfoViewSet,
    AddressViewSet,
    IdentityDocumentViewSet,
)

router = DefaultRouter()
router.register(r"people/persons", PersonViewSet, basename="person")
router.register(r"people/contact-info", ContactInfoViewSet, basename="contact-info")
router.register(r"people/addresses", AddressViewSet, basename="address")
router.register(r"people/identity-documents", IdentityDocumentViewSet, basename="identity-document")

urlpatterns = [
    path("api/", include(router.urls)),
]
