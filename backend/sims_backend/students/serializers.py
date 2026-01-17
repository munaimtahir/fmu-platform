from rest_framework import serializers

from sims_backend.students.models import LeavePeriod, Student


class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    person_name = serializers.CharField(source='person.full_name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'name', 'person', 'person_name', 'user',
            'program', 'program_name', 'batch', 'batch_name',
            'group', 'group_name', 'status',
            'enrollment_year', 'expected_graduation_year', 'actual_graduation_year',
            'email', 'phone', 'date_of_birth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StudentPlacementSerializer(serializers.Serializer):
    """Serializer for updating student placement (Program/Batch/Group)"""
    # Import here to avoid circular imports at module level
    def __init__(self, *args, **kwargs):
        from sims_backend.academics.models import Batch, Group, Program
        super().__init__(*args, **kwargs)
        self.fields['program'] = serializers.PrimaryKeyRelatedField(queryset=Program.objects.all())
        self.fields['batch'] = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all())
        self.fields['group'] = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())

    def validate(self, data):
        # Ensure batch belongs to program
        if data['batch'].program != data['program']:
            raise serializers.ValidationError("Batch must belong to the specified program")
        # Ensure group belongs to batch
        if data['group'].batch != data['batch']:
            raise serializers.ValidationError("Group must belong to the specified batch")
        return data


class LeavePeriodSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source='student.reg_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = LeavePeriod
        fields = [
            'id', 'student', 'student_reg_no', 'student_name',
            'type', 'start_date', 'end_date', 'reason',
            'status', 'approved_by', 'approved_by_username',
            'counts_toward_graduation',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'counts_toward_graduation', 'approved_by']

