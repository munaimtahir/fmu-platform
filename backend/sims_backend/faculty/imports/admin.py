from django.contrib import admin

from .models import FacultyImportJob


@admin.register(FacultyImportJob)
class FacultyImportJobAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'original_filename', 'status', 'mode', 'created_by', 'created_at',
        'total_rows', 'valid_rows', 'invalid_rows', 'created_count', 'updated_count'
    ]
    list_filter = ['status', 'mode', 'created_at']
    search_fields = ['original_filename', 'created_by__username']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'finished_at', 'file_hash',
        'total_rows', 'valid_rows', 'invalid_rows',
        'created_count', 'updated_count', 'failed_count', 'summary'
    ]
    date_hierarchy = 'created_at'
