"""Admin configuration for people module."""
from django.contrib import admin

from .models import Person, ContactInfo, Address, IdentityDocument


class ContactInfoInline(admin.TabularInline):
    model = ContactInfo
    extra = 0


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0


class IdentityDocumentInline(admin.TabularInline):
    model = IdentityDocument
    extra = 0


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["full_name", "gender", "date_of_birth", "national_id", "created_at"]
    list_filter = ["gender", "created_at"]
    search_fields = ["first_name", "last_name", "national_id"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ContactInfoInline, AddressInline, IdentityDocumentInline]


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ["person", "type", "value", "is_primary", "is_verified"]
    list_filter = ["type", "is_primary", "is_verified"]
    search_fields = ["value", "person__first_name", "person__last_name"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["person", "type", "city", "country", "is_primary"]
    list_filter = ["type", "country", "is_primary"]
    search_fields = ["street", "city", "person__first_name", "person__last_name"]


@admin.register(IdentityDocument)
class IdentityDocumentAdmin(admin.ModelAdmin):
    list_display = ["person", "type", "document_number", "expiry_date", "is_verified"]
    list_filter = ["type", "is_verified"]
    search_fields = ["document_number", "person__first_name", "person__last_name"]
