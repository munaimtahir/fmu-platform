from django.contrib import admin

from sims_backend.students.models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['reg_no', 'name', 'program', 'batch', 'group', 'status']
    list_filter = ['status', 'program', 'batch', 'group']
    search_fields = ['reg_no', 'name', 'email', 'phone']
    ordering = ['reg_no']

