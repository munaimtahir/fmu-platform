from django.contrib import admin

from sims_backend.students.imports.models import ImportJob
from sims_backend.students.models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["reg_no", "display_name", "program", "batch", "group", "status"]
    list_filter = ["status", "program", "batch", "group"]
    search_fields = ["reg_no", "person__first_name", "person__middle_name", "person__last_name", "person__contact_info__value"]
    ordering = ["reg_no"]
    readonly_fields = [field.name for field in Student._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "original_filename",
        "status",
        "created_by",
        "created_at",
        "total_rows",
        "valid_rows",
        "invalid_rows",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["original_filename", "created_by__username"]
    readonly_fields = ["id", "file_hash", "created_at", "updated_at", "finished_at"]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
