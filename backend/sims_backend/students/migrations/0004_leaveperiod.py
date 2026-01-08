# Generated manually to add LeavePeriod model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('students', '0003_student_person_enrollment_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='LeavePeriod',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('type', models.CharField(
                    choices=[
                        ('medical', 'Medical Leave'),
                        ('personal', 'Personal Leave'),
                        ('academic', 'Academic Leave'),
                        ('absence', 'Absence Leave'),
                    ],
                    help_text='Type of leave',
                    max_length=20,
                )),
                ('start_date', models.DateField(help_text='Leave start date')),
                ('end_date', models.DateField(blank=True, help_text='Leave end date (null for ongoing leave)', null=True)),
                ('reason', models.TextField(help_text='Reason for leave')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                        ('completed', 'Completed'),
                    ],
                    default='pending',
                    help_text='Leave status',
                    max_length=20,
                )),
                ('counts_toward_graduation', models.BooleanField(
                    default=True,
                    help_text='Whether this leave counts toward time-to-graduation (absence leave excluded)',
                )),
                ('student', models.ForeignKey(
                    help_text='Student on leave',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='leave_periods',
                    to='students.student',
                )),
                ('approved_by', models.ForeignKey(
                    blank=True,
                    help_text='User who approved the leave',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='approved_leaves',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-start_date'],
                'indexes': [
                    models.Index(fields=['student', 'status'], name='students_le_student_idx'),
                    models.Index(fields=['start_date', 'end_date'], name='students_le_start_d_idx'),
                ],
            },
        ),
    ]
