# Generated manually on 2026-01-09
# Adds status and is_enrollment_open fields to AcademicPeriod model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0003_program_structure_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="academicperiod",
            name="status",
            field=models.CharField(
                choices=[("OPEN", "Open"), ("CLOSED", "Closed")],
                default="OPEN",
                help_text="Period status (OPEN allows enrollment, CLOSED blocks it)",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="academicperiod",
            name="is_enrollment_open",
            field=models.BooleanField(
                default=True,
                help_text="Whether enrollment is open for this period",
            ),
        ),
        migrations.AddIndex(
            model_name="academicperiod",
            index=models.Index(fields=["status"], name="academics_a_status_fa452d_idx"),
        ),
        migrations.AddIndex(
            model_name="academicperiod",
            index=models.Index(fields=["period_type", "status"], name="academics_a_period__710fbc_idx"),
        ),
    ]
