from django.contrib import admin

from sims_backend.timetable.models import Session, WeeklyTimetable, TimetableCell


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['department', 'group', 'faculty', 'starts_at', 'ends_at']
    list_filter = ['academic_period', 'department', 'group']
    search_fields = ['department__name', 'group__name', 'faculty__username']
    ordering = ['starts_at']


@admin.register(WeeklyTimetable)
class WeeklyTimetableAdmin(admin.ModelAdmin):
    list_display = ['batch', 'academic_period', 'week_start_date', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'academic_period', 'batch', 'week_start_date']
    search_fields = ['batch__name', 'academic_period__name', 'created_by__username']
    ordering = ['-week_start_date', 'batch']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TimetableCell)
class TimetableCellAdmin(admin.ModelAdmin):
    list_display = ['weekly_timetable', 'day_of_week', 'time_slot', 'line1', 'line2', 'line3']
    list_filter = ['day_of_week', 'time_slot', 'weekly_timetable']
    search_fields = ['line1', 'line2', 'line3', 'weekly_timetable__batch__name']
    ordering = ['weekly_timetable', 'day_of_week', 'time_slot']

