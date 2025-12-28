import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("academics", "0001_initial"), ("admissions", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Assessment",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("type", models.CharField(max_length=64)),
                ("weight", models.PositiveSmallIntegerField(default=10)),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assessments",
                        to="academics.section",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AssessmentScore",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("score", models.FloatField(default=0)),
                ("max_score", models.FloatField(default=100)),
                (
                    "assessment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="scores",
                        to="assessments.assessment",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assessment_scores",
                        to="admissions.student",
                    ),
                ),
            ],
            options={"unique_together": {("assessment", "student")}},
        ),
    ]
