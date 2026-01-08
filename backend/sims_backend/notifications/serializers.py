from rest_framework import serializers

from .models import Notification, NotificationPreference, NotificationTemplate


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = [
            "id",
            "code",
            "name",
            "channel",
            "subject",
            "body",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    template_code = serializers.CharField(source="template.code", read_only=True)
    template_name = serializers.CharField(source="template.name", read_only=True)
    recipient_username = serializers.CharField(source="recipient.username", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "recipient_username",
            "recipient_email",
            "recipient_phone",
            "template",
            "template_code",
            "template_name",
            "channel",
            "subject",
            "body",
            "status",
            "sent_at",
            "delivered_at",
            "error_message",
            "metadata",
            "created_at",
        ]
        read_only_fields = [
            "status",
            "sent_at",
            "delivered_at",
            "error_message",
            "created_at",
        ]


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient_email",
            "recipient_phone",
            "template_name",
            "channel",
            "status",
            "sent_at",
            "created_at",
        ]


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending notifications."""
    template_code = serializers.CharField(required=False)
    recipient_id = serializers.IntegerField(required=False)
    recipient_email = serializers.EmailField(required=False)
    recipient_phone = serializers.CharField(required=False)
    channel = serializers.ChoiceField(
        choices=NotificationTemplate.CHANNEL_CHOICES,
        required=True
    )
    subject = serializers.CharField(required=False)
    body = serializers.CharField(required=False)
    metadata = serializers.JSONField(required=False, default=dict)

    def validate(self, data):
        """Ensure at least one recipient is provided."""
        if not any([
            data.get("recipient_id"),
            data.get("recipient_email"),
            data.get("recipient_phone"),
        ]):
            raise serializers.ValidationError(
                "At least one recipient (recipient_id, recipient_email, or recipient_phone) must be provided"
            )

        # If template_code is provided, subject and body are optional
        # If no template_code, subject and body are required
        if not data.get("template_code"):
            if not data.get("subject") or not data.get("body"):
                raise serializers.ValidationError(
                    "If no template_code is provided, both subject and body are required"
                )

        return data


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "user",
            "channel",
            "is_enabled",
            "notification_types",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]
