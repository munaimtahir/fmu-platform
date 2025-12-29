from django.contrib import admin

from core.models import Profile, FacultyProfile


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
