from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from sims_backend.notifications.models import (
    Notification,
    NotificationAudience,
    NotificationInbox,
)

User = get_user_model()


class NotificationAudienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationAudience
        fields = [
            "id",
            "audience_type",
            "student",
            "section",
            "batch",
            "program",
            "group",
            "filters_json",
        ]

    def validate(self, attrs):
        audience_type = attrs.get("audience_type")
        required_field_map = {
            NotificationAudience.AUDIENCE_STUDENT: "student",
            NotificationAudience.AUDIENCE_SECTION: "section",
            NotificationAudience.AUDIENCE_BATCH: "batch",
            NotificationAudience.AUDIENCE_PROGRAM: "program",
            NotificationAudience.AUDIENCE_GROUP: "group",
        }

        target_fields = ["student", "section", "batch", "program", "group"]
        provided_fields = [field for field in target_fields if attrs.get(field) is not None]

        if audience_type == NotificationAudience.AUDIENCE_ALL_STUDENTS:
            if provided_fields:
                raise serializers.ValidationError(
                    {
                        "audience_type": "ALL_STUDENTS must not include target fields.",
                        "targets": "Remove student/section/batch/program/group from ALL_STUDENTS.",
                    }
                )
            return attrs

        required_field = required_field_map.get(audience_type)
        if required_field and not attrs.get(required_field):
            raise serializers.ValidationError(
                {required_field: f"{required_field} is required for {audience_type}."}
            )

        if required_field and (len(provided_fields) != 1 or provided_fields[0] != required_field):
            raise serializers.ValidationError(
                {
                    "targets": f"{audience_type} must include only {required_field} and no other target fields."
                }
            )
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    audiences = NotificationAudienceSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "body",
            "category",
            "priority",
            "created_by",
            "created_by_name",
            "send_email",
            "publish_at",
            "expires_at",
            "status",
            "created_at",
            "audiences",
        ]
        read_only_fields = ["created_at", "created_by", "status"]


class NotificationCreateSerializer(serializers.ModelSerializer):
    audiences = NotificationAudienceSerializer(many=True, write_only=True)
    send_now = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "body",
            "category",
            "priority",
            "send_email",
            "publish_at",
            "expires_at",
            "status",
            "audiences",
            "send_now",
            "created_at",
        ]
        read_only_fields = ["created_at", "status"]

    def create(self, validated_data):
        audiences_data = validated_data.pop("audiences", [])
        send_now = validated_data.pop("send_now", False)
        user = self.context["request"].user
        notification = Notification.objects.create(created_by=user, **validated_data)
        NotificationAudience.objects.bulk_create(
            [NotificationAudience(notification=notification, **audience) for audience in audiences_data]
        )
        if send_now:
            notification.status = Notification.STATUS_QUEUED
            if not notification.publish_at:
                notification.publish_at = timezone.now()
            notification.save(update_fields=["status", "publish_at", "updated_at"])
        return notification


class NotificationPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "body",
            "category",
            "priority",
            "publish_at",
            "expires_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationInboxSerializer(serializers.ModelSerializer):
    notification = NotificationPublicSerializer(read_only=True)

    class Meta:
        model = NotificationInbox
        fields = [
            "id",
            "notification",
            "delivered_at",
            "read_at",
            "is_deleted",
        ]
        read_only_fields = fields
