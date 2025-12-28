from rest_framework import serializers

from .models import Student, StudentApplication


class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    program_full_name = serializers.CharField(source="program.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "reg_no",
            "name",
            "program",
            "program_name",
            "program_full_name",
            "batch_year",
            "current_year",
            "status",
            "status_display",
            "email",
            "phone",
            "date_of_birth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_reg_no(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Registration number is required.")
        return value


class StudentApplicationSerializer(serializers.ModelSerializer):
    """Serializer for student applications submitted through public form"""

    program_name = serializers.CharField(source="program.name", read_only=True)
    program_full_name = serializers.CharField(source="program.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentApplication
        fields = [
            "id",
            "full_name",
            "date_of_birth",
            "email",
            "phone",
            "address",
            "program",
            "program_name",
            "program_full_name",
            "batch_year",
            "previous_qualification",
            "previous_institution",
            "status",
            "status_display",
            "notes",
            "documents",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip() or obj.reviewed_by.username
        return None


class StudentApplicationPublicSerializer(serializers.ModelSerializer):
    """Public serializer for submitting student applications (no admin fields)"""

    class Meta:
        model = StudentApplication
        fields = [
            "full_name",
            "date_of_birth",
            "email",
            "phone",
            "address",
            "program",
            "batch_year",
            "previous_qualification",
            "previous_institution",
            "documents",
        ]

    def validate_batch_year(self, value):
        """Validate that batch year is reasonable"""
        from datetime import date
        current_year = date.today().year
        if value < current_year or value > current_year + 10:
            raise serializers.ValidationError(
                f"Batch year must be between {current_year} and {current_year + 10}"
            )
        return value
