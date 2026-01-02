from django.contrib import admin

from sims_backend.attendance.models import Attendance, AttendanceInputJob, BiometricDevice, BiometricPunch


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'status', 'marked_by', 'marked_at']
    list_filter = ['status', 'marked_at']
    search_fields = ['student__reg_no', 'student__name', 'session__department__name']
    ordering = ['-marked_at']


@admin.register(AttendanceInputJob)
class AttendanceInputJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'input_type', 'session', 'date', 'status', 'uploaded_by', 'created_at']
    list_filter = ['input_type', 'status']
    search_fields = ['session__group__name', 'uploaded_by__username', 'original_filename']
    ordering = ['-created_at']


@admin.register(BiometricDevice)
class BiometricDeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'location']


@admin.register(BiometricPunch)
class BiometricPunchAdmin(admin.ModelAdmin):
    list_display = ['student', 'device', 'punched_at', 'raw_identifier']
    list_filter = ['punched_at']
    search_fields = ['student__reg_no', 'raw_identifier']
