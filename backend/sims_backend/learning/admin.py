from django.contrib import admin

from sims_backend.learning.models import (
    LearningMaterial,
    LearningMaterialAudience,
    LearningMaterialReadReceipt,
)


@admin.register(LearningMaterial)
class LearningMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "status", "created_by", "published_at", "created_at")
    list_filter = ("kind", "status")
    search_fields = ("title", "description")
    raw_id_fields = ("created_by",)


@admin.register(LearningMaterialAudience)
class LearningMaterialAudienceAdmin(admin.ModelAdmin):
    list_display = ("material", "program", "batch", "term", "course", "section", "created_at")
    list_filter = ("program", "batch", "term", "course", "section")
    raw_id_fields = ("material", "program", "batch", "term", "course", "section")


@admin.register(LearningMaterialReadReceipt)
class LearningMaterialReadReceiptAdmin(admin.ModelAdmin):
    list_display = ("material", "student", "seen_at")
    list_filter = ("seen_at",)
    raw_id_fields = ("material", "student")
