import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("admissions", "0001_initial"), ("academics", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Result",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("final_grade", models.CharField(max_length=8, blank=True, default="")),
                ("published_at", models.DateTimeField(null=True, blank=True)),
                (
                    "published_by",
                    models.CharField(max_length=128, blank=True, default=""),
                ),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="results",
                        to="academics.section",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="results",
                        to="admissions.student",
                    ),
                ),
            ],
        ),
    ]
