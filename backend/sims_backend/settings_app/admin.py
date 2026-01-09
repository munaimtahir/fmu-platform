"""Django admin for settings models."""
from django.contrib import admin

from .models import AppSetting


@admin.register(AppSetting)
class AppSettingAdmin(admin.ModelAdmin):
    """Admin interface for AppSetting."""
    
    list_display = ["key", "value_type", "value_json", "updated_by", "updated_at"]
    list_filter = ["value_type"]
    search_fields = ["key", "description"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["key"]
