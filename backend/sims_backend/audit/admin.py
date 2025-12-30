from django.contrib import admin

from sims_backend.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Read-only admin interface for audit logs."""

    list_display = ['timestamp', 'actor', 'method', 'path', 'status_code', 'model', 'object_id']
    list_filter = ['method', 'status_code', 'model', 'timestamp']
    search_fields = ['actor__username', 'path', 'model', 'object_id', 'summary']
    ordering = ['-timestamp']
    readonly_fields = [
        'id',
        'timestamp',
        'actor',
        'method',
        'path',
        'status_code',
        'model',
        'object_id',
        'summary',
        'request_data',
    ]

    def has_add_permission(self, request):
        """Audit logs cannot be manually created."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Audit logs are immutable and cannot be deleted."""
        return False

    def has_change_permission(self, request, obj=None):
        """Audit logs are immutable and cannot be changed."""
        return False
