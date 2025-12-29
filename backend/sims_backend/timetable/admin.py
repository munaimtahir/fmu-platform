from django.contrib import admin

from sims_backend.timetable.models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['department', 'group', 'faculty', 'starts_at', 'ends_at']
    list_filter = ['academic_period', 'department', 'group']
    search_fields = ['department__name', 'group__name', 'faculty__username']
    ordering = ['starts_at']

