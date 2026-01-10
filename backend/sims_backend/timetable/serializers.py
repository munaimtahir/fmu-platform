from rest_framework import serializers

from sims_backend.timetable.models import Session, WeeklyTimetable, TimetableCell


class SessionSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'academic_period', 'academic_period_name', 'group', 'group_name',
            'faculty', 'faculty_name', 'department', 'department_name',
            'starts_at', 'ends_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TimetableCellSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = TimetableCell
        fields = [
            'id', 'weekly_timetable', 'day_of_week', 'day_of_week_display',
            'time_slot', 'line1', 'line2', 'line3', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class WeeklyTimetableSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    batch_program_name = serializers.CharField(source='batch.program.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    cells = TimetableCellSerializer(many=True, read_only=True)
    week_end_date = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyTimetable
        fields = [
            'id', 'academic_period', 'academic_period_name', 'batch', 'batch_name', 'batch_program_name',
            'week_start_date', 'week_end_date', 'status', 'created_by', 'created_by_name',
            'cells', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_week_end_date(self, obj):
        """Calculate Saturday (week_end_date) from Monday (week_start_date)"""
        from datetime import timedelta
        return obj.week_start_date + timedelta(days=5)  # Monday + 5 days = Saturday

    def create(self, validated_data):
        """Set created_by to current user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class WeeklyTimetableListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    batch_program_name = serializers.CharField(source='batch.program.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    week_end_date = serializers.SerializerMethodField()
    cell_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyTimetable
        fields = [
            'id', 'academic_period', 'academic_period_name', 'batch', 'batch_name', 'batch_program_name',
            'week_start_date', 'week_end_date', 'status', 'created_by', 'created_by_name',
            'cell_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_week_end_date(self, obj):
        """Calculate Saturday (week_end_date) from Monday (week_start_date)"""
        from datetime import timedelta
        return obj.week_start_date + timedelta(days=5)

    def get_cell_count(self, obj):
        """Get count of cells in this timetable"""
        return obj.cells.count()

