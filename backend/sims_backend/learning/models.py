from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class LearningMaterial(TimeStampedModel):
    KIND_FILE = "FILE"
    KIND_LINK = "LINK"

    STATUS_DRAFT = "DRAFT"
    STATUS_PUBLISHED = "PUBLISHED"
    STATUS_ARCHIVED = "ARCHIVED"

    KIND_CHOICES = [
        (KIND_FILE, "File"),
        (KIND_LINK, "Link"),
    ]

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    file = models.FileField(upload_to="learning/", null=True, blank=True)
    url = models.URLField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
    )
    published_at = models.DateTimeField(null=True, blank=True)
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_learning_materials",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["published_at"]),
            models.Index(fields=["available_from", "available_until"]),
        ]

    def clean(self):
        errors = {}
        if self.kind == self.KIND_FILE:
            if not self.file:
                errors["file"] = "File is required when kind is FILE."
            if self.url:
                errors["url"] = "URL must be empty when kind is FILE."
        if self.kind == self.KIND_LINK:
            if not self.url:
                errors["url"] = "URL is required when kind is LINK."
            if self.file:
                errors["file"] = "File must be empty when kind is LINK."
        if self.available_from and self.available_until:
            if self.available_until <= self.available_from:
                errors["available_until"] = "available_until must be after available_from."
        if errors:
            raise ValidationError(errors)

    def publish(self):
        self.status = self.STATUS_PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])

    def archive(self):
        self.status = self.STATUS_ARCHIVED
        self.save(update_fields=["status", "updated_at"])

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"


class LearningMaterialAudience(models.Model):
    material = models.ForeignKey(
        LearningMaterial,
        on_delete=models.CASCADE,
        related_name="audiences",
    )
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="learning_material_audiences",
    )
    batch = models.ForeignKey(
        "academics.Batch",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="learning_material_audiences",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="learning_material_audiences",
    )
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="learning_material_audiences",
    )
    section = models.ForeignKey(
        "academics.Section",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="learning_material_audiences",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["material", "program"]),
            models.Index(fields=["material", "batch"]),
            models.Index(fields=["material", "term"]),
            models.Index(fields=["material", "course"]),
            models.Index(fields=["material", "section"]),
        ]

    def clean(self):
        if not any([self.program, self.batch, self.term, self.course, self.section]):
            raise ValidationError("At least one audience scope must be set.")

    def __str__(self) -> str:
        return f"Audience for {self.material_id}"


class LearningMaterialReadReceipt(models.Model):
    material = models.ForeignKey(
        LearningMaterial,
        on_delete=models.CASCADE,
        related_name="read_receipts",
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="learning_read_receipts",
    )
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["material", "student"], name="uniq_learning_read_receipt"),
        ]
        indexes = [
            models.Index(fields=["student", "seen_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.student_id} read {self.material_id}"
