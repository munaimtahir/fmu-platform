"""Serializers for enrollment module."""
from rest_framework import serializers

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model."""

    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    course_code = serializers.CharField(source="section.course.code", read_only=True)
    course_name = serializers.CharField(source="section.course.name", read_only=True)
    academic_period_name = serializers.CharField(source="academic_period.name", read_only=True)
    enrolled_by_username = serializers.CharField(source="enrolled_by.username", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id", "student", "student_reg_no", "student_name",
            "section", "section_name", "course_code", "course_name",
            "academic_period", "academic_period_name",
            "status", "enrolled_at", "enrolled_by", "enrolled_by_username",
            "dropped_at", "drop_reason", "grade",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "student_reg_no", "student_name", "section_name",
            "course_code", "course_name", "academic_period_name",
            "enrolled_by", "enrolled_by_username", "enrolled_at",
            "dropped_at", "created_at", "updated_at"
        ]


class EnrollmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Enrollment list views."""

    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    course_code = serializers.CharField(source="section.course.code", read_only=True)
    academic_period_name = serializers.CharField(source="academic_period.name", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id", "student_reg_no", "student_name", "course_code",
            "academic_period_name", "status", "enrolled_at", "grade"
        ]
        read_only_fields = fields
