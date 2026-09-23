"""
Admin configuration for Student Intake submissions.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import StudentIntakeSubmission


@admin.register(StudentIntakeSubmission)
class StudentIntakeSubmissionAdmin(admin.ModelAdmin):
    """Admin interface for managing student intake submissions."""

    list_display = [
        "submission_id",
        "full_name",
        "mdcat_roll_number",
        "merit_number",
        "merit_percentage",
        "mobile_display",
        "email_display",
        "status",
        "created_at",
        "approved_by",
    ]

    list_filter = [
        "status",
        "created_at",
        "gender",
        "last_qualification",
    ]

    search_fields = [
        "submission_id",
        "full_name",
        "cnic_or_bform",
        "mobile",
        "email",
        "mdcat_roll_number",
    ]

    readonly_fields = [
        "submission_id",
        "created_at",
        "updated_at",
        "approved_by",
        "approved_at",
        "created_student",
        "duplicate_check_display",
    ]

    fieldsets = (
        ("Submission Information", {"fields": ("submission_id", "status", "created_at", "updated_at")}),
        (
            "Personal Information",
            {
                "fields": (
                    "full_name",
                    "father_name",
                    "gender",
                    "date_of_birth",
                    "cnic_or_bform",
                    "mobile",
                    "email",
                    "address",
                )
            },
        ),
        ("Guardian Information", {"fields": ("guardian_name", "guardian_relation", "guardian_phone_whatsapp")}),
        ("Admission / Merit Details", {"fields": ("mdcat_roll_number", "merit_number", "merit_percentage")}),
        (
            "Academic Background",
            {
                "fields": (
                    "last_qualification",
                    "institute_name",
                    "board_or_university",
                    "passing_year",
                    "total_marks_or_grade",
                    "obtained_marks_or_grade",
                    "subjects",
                )
            },
        ),
        (
            "Documents",
            {
                "fields": (
                    "passport_size_photo",
                    "cnic_front",
                    "cnic_back",
                    "domicile",
                    "matric_certificate",
                    "fsc_certificate",
                    "migration_certificate",
                    "other_document_1",
                    "other_document_2",
                )
            },
        ),
        (
            "Review & Approval",
            {
                "fields": (
                    "staff_notes",
                    "force_approve",
                    "duplicate_check_display",
                    "approved_by",
                    "approved_at",
                    "created_student",
                )
            },
        ),
    )

    actions = None

    def mobile_display(self, obj):
        """Display mobile number (redacted for privacy)."""
        if obj.mobile:
            # Show only last 4 digits
            return f"***{obj.mobile[-4:]}" if len(obj.mobile) >= 4 else "***"
        return "-"

    mobile_display.short_description = "Mobile"

    def email_display(self, obj):
        """Display email (partially redacted for privacy)."""
        if obj.email:
            parts = obj.email.split("@")
            if len(parts) == 2:
                username = parts[0]
                domain = parts[1]
                # Show first 2 chars and last 2 chars of username
                if len(username) > 4:
                    masked = f"{username[:2]}***{username[-2:]}@{domain}"
                else:
                    masked = f"***@{domain}"
                return masked
        return "-"

    email_display.short_description = "Email"

    def duplicate_check_display(self, obj):
        """Display duplicate check results."""
        if obj.pk:
            duplicates = obj.check_duplicates()
            has_duplicates = any(duplicates.values())

            if not has_duplicates:
                return format_html('<span style="color: green;">✓ No duplicates found</span>')

            result = []
            if duplicates["cnic"]:
                result.append(f"<strong>CNIC:</strong> {', '.join(duplicates['cnic'])}")
            if duplicates["mobile"]:
                result.append(f"<strong>Mobile:</strong> {', '.join(duplicates['mobile'])}")
            if duplicates["email"]:
                result.append(f"<strong>Email:</strong> {', '.join(duplicates['email'])}")
            if duplicates["mdcat"]:
                result.append(f"<strong>MDCAT:</strong> {', '.join(duplicates['mdcat'])}")

            return format_html('<span style="color: red;">⚠ Duplicates found:</span><br/>' + "<br/>".join(result))
        return "Save the submission first to check for duplicates."

    duplicate_check_display.short_description = "Duplicate Check"

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related("approved_by", "created_student")
