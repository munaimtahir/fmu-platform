"""App settings serializers."""
from rest_framework import serializers

from .models import AppSetting


class AppSettingSerializer(serializers.ModelSerializer):
    """Serializer for AppSetting."""
    
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True)
    
    class Meta:
        model = AppSetting
        fields = [
            "id",
            "key",
            "value_json",
            "value_type",
            "description",
            "updated_by",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "description"]
    
    def validate(self, data):
        """Validate key and value."""
        key = data.get("key")
        value = data.get("value_json")
        value_type = data.get("value_type")
        
        if key not in AppSetting.ALLOWED_KEYS:
            raise serializers.ValidationError(f"Key '{key}' is not in the allowlist.")
        
        key_config = AppSetting.ALLOWED_KEYS[key]
        if value_type != key_config["type"]:
            raise serializers.ValidationError(
                f"Value type must be '{key_config['type']}' for key '{key}'"
            )
        
        if not key_config["validation"](value):
            raise serializers.ValidationError(f"Invalid value for key '{key}'")
        
        return data
