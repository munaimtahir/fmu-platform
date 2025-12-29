from rest_framework import serializers

from sims_backend.attendance.models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source='student.reg_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    session_department = serializers.CharField(source='session.department.name', read_only=True)
    marked_by_username = serializers.CharField(source='marked_by.username', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'session', 'student', 'student_reg_no', 'student_name',
            'session_department', 'status', 'marked_by', 'marked_by_username',
            'marked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['marked_by', 'marked_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Set marked_by to current user
        validated_data['marked_by'] = self.context['request'].user
        return super().create(validated_data)
