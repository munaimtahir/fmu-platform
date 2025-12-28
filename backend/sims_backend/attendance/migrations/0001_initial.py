import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("admissions", "0001_initial"), ("academics", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Attendance",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("date", models.DateField()),
                ("present", models.BooleanField(default=True)),
                ("reason", models.CharField(max_length=255, blank=True, default="")),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attendance",
                        to="academics.section",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attendance",
                        to="admissions.student",
                    ),
                ),
            ],
            options={"unique_together": {("section", "student", "date")}},
        ),
    ]
