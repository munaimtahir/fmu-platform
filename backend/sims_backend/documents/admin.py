from django.contrib import admin

from .models import Document, DocumentGenerationJob, DocumentType


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["code", "name"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "document_number",
        "type",
        "student",
        "status",
        "generated_at",
        "requested_by",
        "requested_at",
    ]
    list_filter = ["type", "status", "requested_at"]
    search_fields = ["document_number", "student__reg_no", "student__name"]
    readonly_fields = ["document_number", "verification_token", "generated_at", "requested_at"]


@admin.register(DocumentGenerationJob)
class DocumentGenerationJobAdmin(admin.ModelAdmin):
    list_display = ["document", "status", "started_at", "completed_at"]
    list_filter = ["status", "started_at"]
    search_fields = ["document__document_number"]
    readonly_fields = ["started_at", "completed_at", "error_message"]
