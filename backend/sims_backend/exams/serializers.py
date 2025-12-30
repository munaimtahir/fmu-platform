from rest_framework import serializers

from sims_backend.common_permissions import in_group
from sims_backend.exams.models import Exam, ExamComponent


class ExamComponentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = ExamComponent
        fields = [
            'id', 'exam', 'name', 'sequence', 'department', 'department_name',
            'max_marks', 'pass_marks', 'pass_percent', 'is_mandatory_to_pass',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        user = self.context['request'].user

        # OfficeAssistant cannot modify academic policy fields
        if in_group(user, 'OFFICE_ASSISTANT'):
            if self.instance:  # Update
                if 'is_mandatory_to_pass' in data and data['is_mandatory_to_pass'] != self.instance.is_mandatory_to_pass:
                    raise serializers.ValidationError("Cannot modify is_mandatory_to_pass (academic policy field)")
                if 'pass_marks' in data and data['pass_marks'] != self.instance.pass_marks:
                    raise serializers.ValidationError("Cannot modify pass_marks (academic policy field)")
                if 'pass_percent' in data and data['pass_percent'] != self.instance.pass_percent:
                    raise serializers.ValidationError("Cannot modify pass_percent (academic policy field)")

        return data


class ExamSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    components = ExamComponentSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'academic_period', 'academic_period_name', 'department', 'department_name',
            'title', 'exam_type', 'scheduled_at', 'published', 'version',
            'passing_mode', 'pass_total_marks', 'pass_total_percent', 'fail_if_any_component_fail',
            'components', 'created_at', 'updated_at'
        ]
        read_only_fields = ['version', 'created_at', 'updated_at']

    def validate(self, data):
        user = self.context['request'].user

        # OfficeAssistant cannot modify passing logic fields
        if in_group(user, 'OFFICE_ASSISTANT'):
            if self.instance:  # Update
                restricted_fields = ['passing_mode', 'pass_total_marks', 'pass_total_percent', 'fail_if_any_component_fail']
                for field in restricted_fields:
                    if field in data and data[field] != getattr(self.instance, field):
                        raise serializers.ValidationError(f"Cannot modify {field} (academic policy field)")

        return data

