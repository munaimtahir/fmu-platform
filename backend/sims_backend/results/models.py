from django.db import models


class Result(models.Model):
    """Student result with state management"""

    STATE_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("frozen", "Frozen"),
    ]

    student = models.ForeignKey(
        "admissions.Student", on_delete=models.CASCADE, related_name="results"
    )
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="results"
    )
    final_grade = models.CharField(max_length=8, blank=True, default="")
    state = models.CharField(max_length=16, choices=STATE_CHOICES, default="draft")
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.CharField(max_length=128, blank=True, default="")
    frozen_at = models.DateTimeField(null=True, blank=True)
    frozen_by = models.CharField(max_length=128, blank=True, default="")

    class Meta:
        unique_together = ("student", "section")


class PendingChange(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    result = models.ForeignKey(
        Result, on_delete=models.CASCADE, related_name="pending_changes"
    )
    requested_by = models.CharField(max_length=128)
    approved_by = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    new_grade = models.CharField(max_length=8)
    reason = models.TextField(blank=True, default="")
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
