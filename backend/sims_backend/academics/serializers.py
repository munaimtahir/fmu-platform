from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Course, Program, Section, Term


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ["id", "name", "status", "start_date", "end_date"]


class ProgramSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source="get_level_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = Program
        fields = [
            "id",
            "level",
            "level_display",
            "category",
            "category_display",
            "name",
            "duration_years",
            "description",
            "is_active",
            "full_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "code", "title", "credits", "program"]


User = get_user_model()


class SectionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(required=False, allow_blank=True)
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
    )
    # Nested course data for read operations
    course_detail = CourseSerializer(source="course", read_only=True)

    def to_internal_value(self, data):
        """Allow creating sections with either a teacher id or a teacher name.

        The existing tests create a section by passing a plain string for the
        ``teacher`` field (representing an ad-hoc instructor name). DRF's
        ``ModelSerializer`` normally expects a primary key for the related
        ``teacher`` user and would raise a validation error for a string
        value. To preserve that lightweight workflow we intercept the raw
        payload before it is validated and, when a non-numeric string is
        supplied, treat it as ``teacher_name`` while leaving the ``teacher``
        relation unset.

        ``QueryDict`` instances are converted to mutable dictionaries so we can
        safely tweak the payload that DRF receives.
        """

        teacher_value = data.get("teacher")

        if isinstance(teacher_value, str):
            stripped = teacher_value.strip()
            if stripped and not stripped.isdecimal():
                # Treat the raw string as the read-only ``teacher_name`` field
                # and drop the relation so validation succeeds without a user
                # instance. ``data`` may be an immutable QueryDict, so make a
                # shallow copy the first time we need to mutate it.
                data = data.copy()
                data["teacher_name"] = stripped
                data["teacher"] = None

        return super().to_internal_value(data)

    def create(self, validated_data):
        teacher_value = validated_data.get("teacher")
        if isinstance(teacher_value, str):
            validated_data["teacher_name"] = teacher_value.strip()
            validated_data["teacher"] = None

        return super().create(validated_data)

    class Meta:
        model = Section
        fields = [
            "id",
            "course",
            "course_detail",
            "term",
            "teacher",
            "teacher_name",
            "capacity",
        ]
