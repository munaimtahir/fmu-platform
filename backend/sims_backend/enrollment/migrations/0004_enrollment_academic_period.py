# Generated manually to add academic_period field
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("enrollment", "0003_enrollment_enrolled_at_enrollment_term"),
        ("academics", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollment",
            name="academic_period",
            field=models.ForeignKey(
                help_text="Academic period of enrollment",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="enrollments",
                to="academics.academicperiod",
            ),
        ),
    ]
