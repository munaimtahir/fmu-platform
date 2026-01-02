from django.contrib import admin

from sims_backend.academics.models import (
    AcademicPeriod,
    Batch,
    Course,
    Department,
    Group,
    Program,
    Section,
)


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['name', 'program', 'start_year']
    list_filter = ['program', 'start_year']
    search_fields = ['name', 'program__name']


@admin.register(AcademicPeriod)
class AcademicPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'period_type', 'parent_period', 'start_date', 'end_date']
    list_filter = ['period_type', 'parent_period']
    search_fields = ['name']
    ordering = ['period_type', 'name']


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'batch', 'created_at']
    list_filter = ['batch__program', 'batch']
    search_fields = ['name', 'batch__name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'academic_period', 'credits']
    list_filter = ['department', 'academic_period']
    search_fields = ['code', 'name', 'department__name']
    ordering = ['code']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'course', 'academic_period', 'faculty', 'group', 'capacity']
    list_filter = ['course', 'academic_period', 'faculty']
    search_fields = ['name', 'course__code', 'course__name']
    ordering = ['course', 'name']

