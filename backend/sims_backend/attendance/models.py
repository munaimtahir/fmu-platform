from django.db import models


class Attendance(models.Model):
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="attendance"
    )
    student = models.ForeignKey(
        "admissions.Student", on_delete=models.CASCADE, related_name="attendance"
    )
    date = models.DateField()
    present = models.BooleanField(default=True)
    reason = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        unique_together = ("section", "student", "date")
