from django.contrib import admin

from sims_backend.attendance.models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'status', 'marked_by', 'marked_at']
    list_filter = ['status', 'marked_at']
    search_fields = ['student__reg_no', 'student__name', 'session__department__name']
    ordering = ['-marked_at']

