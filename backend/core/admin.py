from django.contrib import admin

from core.models import (
    FacultyProfile,
    Profile,
    Role,
    PermissionTask,
    RoleTaskAssignment,
    UserTaskAssignment,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'date_of_birth']
    list_filter = ['date_of_birth']
    search_fields = ['user__username', 'user__email', 'phone']


@admin.register(FacultyProfile)
class FacultyProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'department']
    list_filter = ['department']
    search_fields = ['user__username', 'user__email', 'department__name']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_system_role', 'created_at']
    list_filter = ['is_system_role']
    search_fields = ['name', 'description']
    readonly_fields = ['is_system_role', 'created_at', 'updated_at']
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of system roles."""
        if obj and obj.is_system_role:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(PermissionTask)
class PermissionTaskAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'module', 'created_at']
    list_filter = ['module']
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RoleTaskAssignment)
class RoleTaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ['role', 'task', 'created_at']
    list_filter = ['role', 'task__module']
    search_fields = ['role__name', 'task__code', 'task__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(UserTaskAssignment)
class UserTaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'task', 'granted_by', 'created_at']
    list_filter = ['task__module']
    search_fields = ['user__username', 'user__email', 'task__code', 'task__name']
    readonly_fields = ['granted_by', 'created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        """Set granted_by to current user on create."""
        if not change:
            obj.granted_by = request.user
        super().save_model(request, obj, form, change)
