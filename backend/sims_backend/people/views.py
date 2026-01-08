"""Views for people module."""
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated

from core.permissions import PermissionTaskRequired, has_permission_task

from .models import Person, ContactInfo, Address, IdentityDocument
from .serializers import (
    PersonSerializer,
    PersonListSerializer,
    ContactInfoSerializer,
    AddressSerializer,
    IdentityDocumentSerializer,
)


class PersonFilter(filters.FilterSet):
    """Filter for Person model."""

    first_name = filters.CharFilter(lookup_expr="icontains")
    last_name = filters.CharFilter(lookup_expr="icontains")
    national_id = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = Person
        fields = ["first_name", "last_name", "national_id", "gender"]


class PersonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Person model.
    
    Permissions:
    - list/retrieve: people.persons.view
    - create: people.persons.create
    - update: people.persons.update
    - delete: people.persons.delete
    - Object-level: Users can view their own person record
    """

    queryset = Person.objects.all().prefetch_related(
        "contact_info", "addresses", "identity_documents"
    )
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_class = PersonFilter
    filter_backends = [filters.DjangoFilterBackend, SearchFilter]
    search_fields = ["first_name", "last_name", "national_id"]
    required_tasks = ["people.persons.view"]

    def get_serializer_class(self):
        if self.action == "list":
            return PersonListSerializer
        return PersonSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["people.persons.view"]
        elif self.action == "create":
            self.required_tasks = ["people.persons.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["people.persons.update"]
        elif self.action == "destroy":
            self.required_tasks = ["people.persons.delete"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: users can view their own person record."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "people.persons.view"):
            return qs

        # Otherwise, return only own person record
        if hasattr(user, "person"):
            return qs.filter(id=user.person.id)
        return qs.none()


class ContactInfoViewSet(viewsets.ModelViewSet):
    """ViewSet for ContactInfo model."""

    queryset = ContactInfo.objects.all().select_related("person")
    serializer_class = ContactInfoSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_fields = ["person", "type", "is_primary", "is_verified"]
    required_tasks = ["people.contact_info.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["people.contact_info.view"]
        elif self.action == "create":
            self.required_tasks = ["people.contact_info.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["people.contact_info.update"]
        elif self.action == "destroy":
            self.required_tasks = ["people.contact_info.delete"]
        return super().get_permissions()


class AddressViewSet(viewsets.ModelViewSet):
    """ViewSet for Address model."""

    queryset = Address.objects.all().select_related("person")
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_fields = ["person", "type", "is_primary", "city", "country"]
    required_tasks = ["people.addresses.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["people.addresses.view"]
        elif self.action == "create":
            self.required_tasks = ["people.addresses.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["people.addresses.update"]
        elif self.action == "destroy":
            self.required_tasks = ["people.addresses.delete"]
        return super().get_permissions()


class IdentityDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for IdentityDocument model."""

    queryset = IdentityDocument.objects.all().select_related("person")
    serializer_class = IdentityDocumentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_fields = ["person", "type", "is_verified"]
    required_tasks = ["people.identity_documents.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["people.identity_documents.view"]
        elif self.action == "create":
            self.required_tasks = ["people.identity_documents.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["people.identity_documents.update"]
        elif self.action == "destroy":
            self.required_tasks = ["people.identity_documents.delete"]
        return super().get_permissions()
