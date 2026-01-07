from django.contrib import admin

from .models import Notification, NotificationPreference, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "channel", "is_active", "created_at"]
    list_filter = ["channel", "is_active"]
    search_fields = ["code", "name"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "recipient",
        "recipient_email",
        "channel",
        "status",
        "sent_at",
        "delivered_at",
    ]
    list_filter = ["channel", "status", "sent_at"]
    search_fields = ["recipient_email", "recipient_phone", "subject"]
    readonly_fields = ["sent_at", "delivered_at", "error_message"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "channel", "is_enabled"]
    list_filter = ["channel", "is_enabled"]
    search_fields = ["user__username"]
