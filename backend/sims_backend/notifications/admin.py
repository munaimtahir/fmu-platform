from django.contrib import admin

from sims_backend.notifications.models import (
    Notification,
    NotificationAudience,
    NotificationDeliveryLog,
    NotificationInbox,
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "priority", "status", "send_email", "created_by", "created_at"]
    list_filter = ["status", "category", "priority", "send_email", "created_at"]
    search_fields = ["title", "body", "created_by__username"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"


@admin.register(NotificationAudience)
class NotificationAudienceAdmin(admin.ModelAdmin):
    list_display = ["notification", "audience_type", "student", "section", "batch", "program", "group"]
    list_filter = ["audience_type"]
    search_fields = ["notification__title"]


@admin.register(NotificationInbox)
class NotificationInboxAdmin(admin.ModelAdmin):
    list_display = ["notification", "user", "delivered_at", "read_at", "is_deleted"]
    list_filter = ["is_deleted", "delivered_at", "read_at"]
    search_fields = ["notification__title", "user__username"]
    readonly_fields = ["created_at", "updated_at", "delivered_at"]


@admin.register(NotificationDeliveryLog)
class NotificationDeliveryLogAdmin(admin.ModelAdmin):
    list_display = ["notification", "channel", "status", "target_count", "success_count", "failure_count", "created_at"]
    list_filter = ["channel", "status", "created_at"]
    search_fields = ["notification__title", "job_id"]
    readonly_fields = ["created_at", "updated_at"]
