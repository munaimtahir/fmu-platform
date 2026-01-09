# Generated manually on 2026-01-03
# Adds structure_type and related fields to Program model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0002_course_section"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="structure_type",
            field=models.CharField(
                choices=[
                    ("YEARLY", "Yearly"),
                    ("SEMESTER", "Semester"),
                    ("CUSTOM", "Custom"),
                ],
                default="YEARLY",
                help_text="Program structure type",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="is_finalized",
            field=models.BooleanField(
                default=False,
                help_text="Whether program structure is finalized (locks structure fields)",
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="period_length_months",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Period length in months (for CUSTOM structure_type)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="total_periods",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Total number of periods (for CUSTOM structure_type)",
                null=True,
            ),
        ),
    ]
