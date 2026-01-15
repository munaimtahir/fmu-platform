# Generated manually for auto_create feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0005_leaveperiod_student_actual_graduation_year_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='importjob',
            name='auto_create',
            field=models.BooleanField(
                default=False,
                help_text='Automatically create missing Programs, Batches, and Groups'
            ),
        ),
    ]
