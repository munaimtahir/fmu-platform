import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("admissions", "0001_initial"), ("academics", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Enrollment",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("status", models.CharField(max_length=32, default="enrolled")),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="enrollments",
                        to="academics.section",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="enrollments",
                        to="admissions.student",
                    ),
                ),
            ],
            options={"unique_together": {("student", "section")}},
        ),
    ]
