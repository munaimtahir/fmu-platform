# Generated manually for WeeklyTimetable feature

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0001_initial'),
        ('timetable', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WeeklyTimetable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('week_start_date', models.DateField(help_text='Monday of the week this timetable covers')),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published')], default='draft', help_text='Status of the timetable (draft/published)', max_length=20)),
                ('academic_period', models.ForeignKey(help_text='Academic period this timetable belongs to', on_delete=django.db.models.deletion.PROTECT, related_name='weekly_timetables', to='academics.academicperiod')),
                ('created_by', models.ForeignKey(help_text='Faculty/Admin who created this timetable', on_delete=django.db.models.deletion.PROTECT, related_name='created_weekly_timetables', to=settings.AUTH_USER_MODEL)),
                ('group', models.ForeignKey(help_text='Group this timetable is for', on_delete=django.db.models.deletion.PROTECT, related_name='weekly_timetables', to='academics.group')),
            ],
            options={
                'ordering': ['week_start_date', 'group'],
                'indexes': [
                    models.Index(fields=['academic_period', 'group', 'week_start_date'], name='timetable_w_academi_abc123_idx'),
                    models.Index(fields=['status'], name='timetable_w_status_def456_idx'),
                    models.Index(fields=['week_start_date'], name='timetable_w_week_s_ghi789_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='TimetableCell',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday')], help_text='Day of the week (0=Monday, 5=Saturday)')),
                ('time_slot', models.CharField(help_text="Time slot identifier (e.g., '09:00-10:00')", max_length=50)),
                ('line1', models.CharField(blank=True, help_text='First line of cell content (e.g., course name)', max_length=200)),
                ('line2', models.CharField(blank=True, help_text='Second line of cell content (e.g., room number)', max_length=200)),
                ('line3', models.CharField(blank=True, help_text='Third line of cell content (e.g., faculty name)', max_length=200)),
                ('weekly_timetable', models.ForeignKey(help_text='Weekly timetable this cell belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='cells', to='timetable.weeklytimetable')),
            ],
            options={
                'ordering': ['day_of_week', 'time_slot'],
                'indexes': [
                    models.Index(fields=['weekly_timetable', 'day_of_week', 'time_slot'], name='timetable_t_weekly__jkl012_idx'),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name='weeklytimetable',
            constraint=models.UniqueConstraint(fields=['group', 'week_start_date'], name='unique_weekly_timetable_per_group_week'),
        ),
        migrations.AddConstraint(
            model_name='timetablecell',
            constraint=models.UniqueConstraint(fields=['weekly_timetable', 'day_of_week', 'time_slot'], name='unique_cell_per_timetable_day_time'),
        ),
    ]
