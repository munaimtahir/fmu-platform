from django.contrib import admin

from sims_backend.students.imports.models import ImportJob
from sims_backend.students.models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['reg_no', 'name', 'program', 'batch', 'group', 'status']
    list_filter = ['status', 'program', 'batch', 'group']
    search_fields = ['reg_no', 'name', 'email', 'phone']
    ordering = ['reg_no']


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'original_filename', 'status', 'mode', 'created_by', 'created_at', 'total_rows', 'valid_rows', 'invalid_rows']
    list_filter = ['status', 'mode', 'created_at']
    search_fields = ['original_filename', 'created_by__username']
    readonly_fields = ['id', 'file_hash', 'created_at', 'updated_at', 'finished_at']
    ordering = ['-created_at']

