from datetime import date

from rest_framework import serializers

from sims_backend.timetable.models import Session, TimetableCell, TimetableEntry, WeeklyTimetable


class SessionSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source="academic_period.name", read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)
    faculty_name = serializers.CharField(source="faculty.get_full_name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "academic_period",
            "academic_period_name",
            "group",
            "group_name",
            "faculty",
            "faculty_name",
            "department",
            "department_name",
            "starts_at",
            "ends_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TimetableCellSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = TimetableCell
        fields = [
            "id",
            "weekly_timetable",
            "day_of_week",
            "day_of_week_display",
            "time_slot",
            "line1",
            "line2",
            "line3",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TimetableEntrySerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source="get_day_of_week_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    course_code = serializers.CharField(source="section.course.code", read_only=True)
    course_name = serializers.CharField(source="section.course.name", read_only=True)
    faculty_name = serializers.SerializerMethodField()
    group_name = serializers.CharField(source="group.name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = TimetableEntry
        fields = [
            "id",
            "weekly_timetable",
            "section",
            "section_name",
            "course_code",
            "course_name",
            "faculty_name",
            "group",
            "group_name",
            "day_of_week",
            "day_of_week_display",
            "start_time",
            "end_time",
            "room",
            "status",
            "status_display",
            "notes",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by"]

    def get_faculty_name(self, obj) -> str | None:
        faculty = obj.section.faculty
        return faculty.get_full_name() or faculty.username if faculty else None

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class WeeklyTimetableSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source="academic_period.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    batch_program_name = serializers.CharField(source="batch.program.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    cells = TimetableCellSerializer(many=True, read_only=True)
    entries = TimetableEntrySerializer(many=True, read_only=True)
    week_end_date = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyTimetable
        fields = [
            "id",
            "academic_period",
            "academic_period_name",
            "batch",
            "batch_name",
            "batch_program_name",
            "week_start_date",
            "week_end_date",
            "status",
            "created_by",
            "created_by_name",
            "cells",
            "entries",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by"]

    def get_week_end_date(self, obj) -> date:
        """Calculate Saturday (week_end_date) from Monday (week_start_date)"""
        from datetime import timedelta

        return obj.week_start_date + timedelta(days=5)  # Monday + 5 days = Saturday

    def create(self, validated_data):
        """Set created_by to current user"""
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class WeeklyTimetableListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""

    academic_period_name = serializers.CharField(source="academic_period.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    batch_program_name = serializers.CharField(source="batch.program.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    week_end_date = serializers.SerializerMethodField()
    cell_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyTimetable
        fields = [
            "id",
            "academic_period",
            "academic_period_name",
            "batch",
            "batch_name",
            "batch_program_name",
            "week_start_date",
            "week_end_date",
            "status",
            "created_by",
            "created_by_name",
            "cell_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_week_end_date(self, obj) -> date:
        """Calculate Saturday (week_end_date) from Monday (week_start_date)"""
        from datetime import timedelta

        return obj.week_start_date + timedelta(days=5)

    def get_cell_count(self, obj) -> int:
        """Get count of cells in this timetable"""
        return obj.cells.count()
