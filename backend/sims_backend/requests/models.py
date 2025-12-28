from django.db import models


class Request(models.Model):
    TYPE_CHOICES = [
        ("transcript", "Transcript"),
        ("bonafide", "Bonafide Certificate"),
        ("noc", "No Objection Certificate"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    student = models.ForeignKey(
        "admissions.Student", on_delete=models.CASCADE, related_name="requests"
    )
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_by = models.CharField(max_length=128, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
