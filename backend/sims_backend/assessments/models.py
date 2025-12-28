from django.db import models


class Assessment(models.Model):
    section = models.ForeignKey(
        "academics.Section", on_delete=models.CASCADE, related_name="assessments"
    )
    type = models.CharField(max_length=64)
    weight = models.PositiveSmallIntegerField(default=10)


class AssessmentScore(models.Model):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="scores"
    )
    student = models.ForeignKey(
        "admissions.Student", on_delete=models.CASCADE, related_name="assessment_scores"
    )
    score = models.FloatField(default=0)
    max_score = models.FloatField(default=100)

    class Meta:
        unique_together = ("assessment", "student")
