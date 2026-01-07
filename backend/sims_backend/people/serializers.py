"""Serializers for people module."""
from rest_framework import serializers

from .models import Person, ContactInfo, Address, IdentityDocument


class ContactInfoSerializer(serializers.ModelSerializer):
    """Serializer for ContactInfo model."""

    class Meta:
        model = ContactInfo
        fields = [
            "id", "person", "type", "value", "label",
            "is_primary", "is_verified", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model."""

    class Meta:
        model = Address
        fields = [
            "id", "person", "type", "street", "city", "state",
            "postal_code", "country", "is_primary", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class IdentityDocumentSerializer(serializers.ModelSerializer):
    """Serializer for IdentityDocument model."""

    class Meta:
        model = IdentityDocument
        fields = [
            "id", "person", "type", "document_number", "issue_date",
            "expiry_date", "issuing_authority", "document_file",
            "is_verified", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "is_verified", "created_at", "updated_at"]


class PersonSerializer(serializers.ModelSerializer):
    """Serializer for Person model."""

    full_name = serializers.ReadOnlyField()
    contact_info = ContactInfoSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    identity_documents = IdentityDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Person
        fields = [
            "id", "user", "first_name", "middle_name", "last_name",
            "full_name", "date_of_birth", "gender", "national_id", "photo",
            "contact_info", "addresses", "identity_documents",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "full_name", "created_at", "updated_at"]


class PersonListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Person list views."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Person
        fields = [
            "id", "first_name", "last_name", "full_name",
            "date_of_birth", "gender", "created_at"
        ]
        read_only_fields = fields
