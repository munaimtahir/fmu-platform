from django.contrib import admin

from .models import Student, StudentApplication


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("reg_no", "name", "program", "batch_year", "current_year", "status")
    search_fields = ("reg_no", "name", "email", "phone", "program__name")
    list_filter = ("program", "status", "batch_year", "current_year")
    ordering = ("reg_no",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Personal Information", {
            "fields": ("reg_no", "name", "email", "phone", "date_of_birth")
        }),
        ("Academic Information", {
            "fields": ("program", "batch_year", "current_year", "status")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(StudentApplication)
class StudentApplicationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "program", "batch_year", "status", "created_at", "reviewed_by")
    search_fields = ("full_name", "email", "phone", "program__name")
    list_filter = ("status", "program", "batch_year", "created_at")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "reviewed_at", "reviewed_by")
    fieldsets = (
        ("Personal Information", {
            "fields": ("full_name", "date_of_birth", "email", "phone", "address")
        }),
        ("Academic Information", {
            "fields": ("program", "batch_year", "previous_qualification", "previous_institution")
        }),
        ("Application Status", {
            "fields": ("status", "notes", "documents")
        }),
        ("Review Information", {
            "fields": ("reviewed_by", "reviewed_at"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    actions = ["approve_applications", "reject_applications"]

    def approve_applications(self, request, queryset):
        """Approve selected applications"""
        count = 0
        for application in queryset.filter(status=StudentApplication.STATUS_PENDING):
            try:
                application.approve(request.user)
                count += 1
            except Exception as e:
                self.message_user(request, f"Error approving {application}: {str(e)}", level="error")
        self.message_user(request, f"Approved {count} application(s).", level="success")
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        """Reject selected applications"""
        count = 0
        for application in queryset.filter(status=StudentApplication.STATUS_PENDING):
            try:
                application.reject(request.user, "Bulk rejection from admin")
                count += 1
            except Exception as e:
                self.message_user(request, f"Error rejecting {application}: {str(e)}", level="error")
        self.message_user(request, f"Rejected {count} application(s).", level="success")
    reject_applications.short_description = "Reject selected applications"
