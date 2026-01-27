from __future__ import annotations

from rest_framework import serializers

from sims_backend.learning.models import (
    LearningMaterial,
    LearningMaterialAudience,
)


class LearningMaterialAudienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterialAudience
        fields = [
            "id",
            "material",
            "program",
            "batch",
            "term",
            "course",
            "section",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        material = attrs.get("material") or getattr(self.instance, "material", None)
        program = attrs.get("program") or getattr(self.instance, "program", None)
        batch = attrs.get("batch") or getattr(self.instance, "batch", None)
        term = attrs.get("term") or getattr(self.instance, "term", None)
        course = attrs.get("course") or getattr(self.instance, "course", None)
        section = attrs.get("section") or getattr(self.instance, "section", None)
        if not any([program, batch, term, course, section]):
            raise serializers.ValidationError(
                {"non_field_errors": ["At least one audience scope must be set."]}
            )
        if material is None:
            raise serializers.ValidationError({"material": ["Material is required."]})
        return attrs


class LearningMaterialSerializer(serializers.ModelSerializer):
    audiences = LearningMaterialAudienceSerializer(many=True, read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            "id",
            "title",
            "description",
            "kind",
            "file",
            "url",
            "mime_type",
            "size_bytes",
            "status",
            "published_at",
            "available_from",
            "available_until",
            "created_by",
            "created_at",
            "updated_at",
            "audiences",
        ]
        read_only_fields = [
            "mime_type",
            "size_bytes",
            "status",
            "published_at",
            "created_by",
            "created_at",
            "updated_at",
            "audiences",
        ]

    def validate(self, attrs):
        kind = attrs.get("kind") or getattr(self.instance, "kind", None)
        file = attrs.get("file") if "file" in attrs else getattr(self.instance, "file", None)
        url = attrs.get("url") if "url" in attrs else getattr(self.instance, "url", None)
        available_from = attrs.get("available_from", getattr(self.instance, "available_from", None))
        available_until = attrs.get("available_until", getattr(self.instance, "available_until", None))

        errors = {}
        if kind == LearningMaterial.KIND_FILE:
            if not file:
                errors["file"] = ["File is required when kind is FILE."]
            if url:
                errors["url"] = ["URL must be empty when kind is FILE."]
        if kind == LearningMaterial.KIND_LINK:
            if not url:
                errors["url"] = ["URL is required when kind is LINK."]
            if file:
                errors["file"] = ["File must be empty when kind is LINK."]
        if available_from and available_until and available_until <= available_from:
            errors["available_until"] = ["available_until must be after available_from."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        material = super().create(validated_data)
        self._set_file_metadata(material, validated_data)
        return material

    def update(self, instance, validated_data):
        material = super().update(instance, validated_data)
        self._set_file_metadata(material, validated_data)
        return material

    def _set_file_metadata(self, material: LearningMaterial, validated_data: dict) -> None:
        if material.kind != LearningMaterial.KIND_FILE:
            return
        upload = validated_data.get("file")
        if upload:
            material.mime_type = getattr(upload, "content_type", None)
            material.size_bytes = getattr(upload, "size", None)
            material.save(update_fields=["mime_type", "size_bytes", "updated_at"])
