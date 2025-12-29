from rest_framework import serializers

from sims_backend.students.models import Student


class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'name', 'program', 'program_name', 'batch', 'batch_name',
            'group', 'group_name', 'status', 'email', 'phone', 'date_of_birth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StudentPlacementSerializer(serializers.Serializer):
    """Serializer for updating student placement (Program/Batch/Group)"""
    program = serializers.PrimaryKeyRelatedField(queryset=None)  # Set in __init__
    batch = serializers.PrimaryKeyRelatedField(queryset=None)
    group = serializers.PrimaryKeyRelatedField(queryset=None)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Import here to avoid circular imports
        from sims_backend.academics.models import Program, Batch, Group
        self.fields['program'].queryset = Program.objects.all()
        self.fields['batch'].queryset = Batch.objects.all()
        self.fields['group'].queryset = Group.objects.all()

    def validate(self, data):
        # Ensure batch belongs to program
        if data['batch'].program != data['program']:
            raise serializers.ValidationError("Batch must belong to the specified program")
        # Ensure group belongs to batch
        if data['group'].batch != data['batch']:
            raise serializers.ValidationError("Group must belong to the specified batch")
        return data

