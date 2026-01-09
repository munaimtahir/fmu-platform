"""Syllabus serializers."""
from rest_framework import serializers

from .models import SyllabusItem


class SyllabusItemSerializer(serializers.ModelSerializer):
    """Serializer for SyllabusItem."""
    
    # Read-only fields for display
    program_name = serializers.CharField(source="program.name", read_only=True)
    period_name = serializers.CharField(source="period.name", read_only=True)
    learning_block_name = serializers.CharField(source="learning_block.name", read_only=True)
    module_name = serializers.CharField(source="module.name", read_only=True)
    
    class Meta:
        model = SyllabusItem
        fields = [
            "id",
            "program",
            "program_name",
            "period",
            "period_name",
            "learning_block",
            "learning_block_name",
            "module",
            "module_name",
            "title",
            "code",
            "description",
            "learning_objectives",
            "order_no",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def validate(self, data):
        """Validate that at least one anchor is set."""
        anchors = [
            data.get("program"),
            data.get("period"),
            data.get("learning_block"),
            data.get("module"),
        ]
        if not any(anchors):
            raise serializers.ValidationError(
                "At least one academic anchor (program, period, block, or module) must be set."
            )
        
        if data.get("order_no", 1) < 1:
            raise serializers.ValidationError("order_no must be >= 1")
        
        return data
