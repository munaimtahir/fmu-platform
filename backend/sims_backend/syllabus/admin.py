"""Django admin for syllabus models."""
from django.contrib import admin

from .models import SyllabusItem


@admin.register(SyllabusItem)
class SyllabusItemAdmin(admin.ModelAdmin):
    """Admin interface for SyllabusItem."""
    
    list_display = ["title", "code", "program", "period", "learning_block", "module", "order_no", "is_active", "created_at"]
    list_filter = ["is_active", "program", "period", "learning_block", "module"]
    search_fields = ["title", "code", "description"]
    ordering = ["order_no", "title"]
    raw_id_fields = ["program", "period", "learning_block", "module"]
