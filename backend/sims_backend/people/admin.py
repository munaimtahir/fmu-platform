"""Admin configuration for people module."""

from django.contrib import admin

from .models import Address, ContactInfo, IdentityDocument, Person


class StudentIdentityProtectionAdmin(admin.ModelAdmin):
    def _linked(self, obj):
        return obj and hasattr(obj if isinstance(obj, Person) else obj.person, "student")

    def has_change_permission(self, request, obj=None):
        return not self._linked(obj) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return not self._linked(obj) and super().has_delete_permission(request, obj)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "person":
            kwargs["queryset"] = Person.objects.filter(student__isnull=True)
        elif db_field.name == "user":
            from django.contrib.auth import get_user_model
            kwargs["queryset"] = get_user_model().objects.filter(student__isnull=True).exclude(groups__name__iexact="STUDENT")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


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
class PersonAdmin(StudentIdentityProtectionAdmin):
    list_display = ["full_name", "gender", "date_of_birth", "national_id", "created_at"]
    list_filter = ["gender", "created_at"]
    search_fields = ["first_name", "last_name", "national_id"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ContactInfoInline, AddressInline, IdentityDocumentInline]


@admin.register(ContactInfo)
class ContactInfoAdmin(StudentIdentityProtectionAdmin):
    list_display = ["person", "type", "value", "is_primary", "is_verified"]
    list_filter = ["type", "is_primary", "is_verified"]
    search_fields = ["value", "person__first_name", "person__last_name"]


@admin.register(Address)
class AddressAdmin(StudentIdentityProtectionAdmin):
    list_display = ["person", "type", "city", "country", "is_primary"]
    list_filter = ["type", "country", "is_primary"]
    search_fields = ["street", "city", "person__first_name", "person__last_name"]


@admin.register(IdentityDocument)
class IdentityDocumentAdmin(StudentIdentityProtectionAdmin):
    list_display = ["person", "type", "document_number", "expiry_date", "is_verified"]
    list_filter = ["type", "is_verified"]
    search_fields = ["document_number", "person__first_name", "person__last_name"]
