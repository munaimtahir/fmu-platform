from django.db import models
from django.utils import timezone


class Enrollment(models.Model):
    student = models.ForeignKey(
        "admissions.Student", on_delete=models.CASCADE, related_name="enrollments"
    )
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="enrollments"
    )
    term = models.CharField(max_length=32, blank=True, default="")
    status = models.CharField(max_length=32, default="enrolled")
    enrolled_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("student", "section")
