from rest_framework import serializers

from sims_backend.timetable.models import Session


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

