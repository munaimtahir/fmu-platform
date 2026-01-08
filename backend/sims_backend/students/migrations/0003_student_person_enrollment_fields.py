# Generated manually to add missing person field and enrollment fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0002_student_user'),
        ('people', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='person',
            field=models.OneToOneField(
                blank=True,
                help_text='Linked person record for identity data',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='student',
                to='people.person',
            ),
        ),
        migrations.AddField(
            model_name='student',
            name='enrollment_year',
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text='Year of enrollment',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='student',
            name='expected_graduation_year',
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text='Expected year of graduation',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='student',
            name='actual_graduation_year',
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text='Actual year of graduation (if graduated)',
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='student',
            name='status',
            field=models.CharField(
                choices=[
                    ('active', 'Active'),
                    ('inactive', 'Inactive'),
                    ('graduated', 'Graduated'),
                    ('suspended', 'Suspended'),
                    ('on_leave', 'On Leave'),
                ],
                default='active',
                help_text='Current status of the student',
                max_length=32,
            ),
        ),
        migrations.AddIndex(
            model_name='student',
            index=models.Index(fields=['enrollment_year'], name='students_st_enrollm_idx'),
        ),
    ]
