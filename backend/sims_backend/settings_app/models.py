"""App settings models."""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from core.models import TimeStampedModel


class AppSetting(TimeStampedModel):
    """
    System settings that can be configured by admins without deployments.
    
    Only keys in the allowlist can be created/updated.
    """
    
    # Allowlist of valid setting keys
    ALLOWED_KEYS = {
        "default_academic_year_id": {
            "type": "integer",
            "description": "Default academic year ID",
            "validation": lambda v: isinstance(v, int) and v > 0,
        },
        "attendance_lock_days": {
            "type": "integer",
            "description": "Number of days after which attendance is locked",
            "validation": lambda v: isinstance(v, int) and 0 <= v <= 365,
        },
        "enable_student_portal": {
            "type": "boolean",
            "description": "Enable student portal access",
            "validation": lambda v: isinstance(v, bool),
        },
        "enable_faculty_portal": {
            "type": "boolean",
            "description": "Enable faculty portal access",
            "validation": lambda v: isinstance(v, bool),
        },
        "ui_banner_message": {
            "type": "string",
            "description": "Banner message displayed in UI",
            "validation": lambda v: isinstance(v, str) and len(v) <= 500,
        },
    }
    
    key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Setting key (must be in allowlist)",
    )
    value_json = models.JSONField(
        help_text="Setting value (JSON-serializable)",
    )
    value_type = models.CharField(
        max_length=20,
        choices=[
            ("boolean", "Boolean"),
            ("integer", "Integer"),
            ("string", "String"),
            ("json", "JSON"),
        ],
        help_text="Type of the value",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this setting",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_settings",
        help_text="User who last updated this setting",
    )
    
    class Meta:
        ordering = ["key"]
        indexes = [
            models.Index(fields=["key"]),
        ]
    
    def __str__(self):
        return f"{self.key} = {self.value_json}"
    
    def clean(self):
        """Validate key is in allowlist and value matches type."""
        if self.key not in self.ALLOWED_KEYS:
            raise ValidationError(f"Key '{self.key}' is not in the allowlist.")
        
        key_config = self.ALLOWED_KEYS[self.key]
        expected_type = key_config["type"]
        
        if self.value_type != expected_type:
            raise ValidationError(
                f"Value type must be '{expected_type}' for key '{self.key}'"
            )
        
        # Validate value
        if not key_config["validation"](self.value_json):
            raise ValidationError(f"Invalid value for key '{self.key}'")
        
        # Additional validation for IDs
        if self.key == "default_academic_year_id":
            # Check if the ID exists (if we have an academic year model)
            # For now, just validate it's a positive integer
            pass
    
    @classmethod
    def get_value(cls, key, default=None):
        """Get setting value by key."""
        try:
            setting = cls.objects.get(key=key)
            return setting.value_json
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_value(cls, key, value, user=None):
        """Set setting value by key."""
        if key not in cls.ALLOWED_KEYS:
            raise ValueError(f"Key '{key}' is not in the allowlist.")
        
        key_config = cls.ALLOWED_KEYS[key]
        value_type = key_config["type"]
        
        # Validate value
        if not key_config["validation"](value):
            raise ValueError(f"Invalid value for key '{key}'")
        
        setting, created = cls.objects.get_or_create(key=key)
        setting.value_json = value
        setting.value_type = value_type
        setting.description = key_config["description"]
        if user:
            setting.updated_by = user
        setting.save()
        return setting
