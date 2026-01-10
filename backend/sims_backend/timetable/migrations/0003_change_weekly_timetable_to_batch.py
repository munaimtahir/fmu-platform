# Generated migration to change WeeklyTimetable from Group to Batch

import django.db.models.deletion
from django.db import migrations, models


def migrate_group_to_batch(apps, schema_editor):
    """Migrate data from group to batch"""
    WeeklyTimetable = apps.get_model('timetable', 'WeeklyTimetable')
    # Check if group field exists (it might not if 0002 was updated)
    if hasattr(WeeklyTimetable, 'group_id'):
        for timetable in WeeklyTimetable.objects.all():
            if timetable.group_id:
                # Get the batch from the group
                Group = apps.get_model('academics', 'Group')
                try:
                    group = Group.objects.get(pk=timetable.group_id)
                    timetable.batch_id = group.batch_id
                    timetable.save()
                except Group.DoesNotExist:
                    # If group doesn't exist, we can't migrate - will need manual intervention
                    pass


def reverse_migrate_batch_to_group(apps, schema_editor):
    """Reverse migration: try to set group from batch (may not be accurate)"""
    WeeklyTimetable = apps.get_model('timetable', 'WeeklyTimetable')
    Group = apps.get_model('academics', 'Group')
    for timetable in WeeklyTimetable.objects.all():
        if timetable.batch_id:
            # Find first group in this batch
            group = Group.objects.filter(batch_id=timetable.batch_id).first()
            if group:
                timetable.group_id = group.id
                timetable.save()


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0001_initial'),
        ('timetable', '0002_weeklytimetable_timetablecell'),
    ]

    operations = [
        # Step 1: Add new batch field (nullable initially)
        migrations.AddField(
            model_name='weeklytimetable',
            name='batch',
            field=models.ForeignKey(
                help_text='Batch this timetable is for',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='weekly_timetables',
                to='academics.batch'
            ),
        ),
        
        # Step 2: Migrate data from group to batch
        migrations.RunPython(migrate_group_to_batch, reverse_migrate_batch_to_group),
        
        # Step 3: Remove old indexes and constraints that reference group
        migrations.RemoveIndex(
            model_name='weeklytimetable',
            name='timetable_w_academi_abc123_idx',
        ),
        migrations.RemoveConstraint(
            model_name='weeklytimetable',
            name='unique_weekly_timetable_per_group_week',
        ),
        
        # Step 4: Remove the group field
        migrations.RemoveField(
            model_name='weeklytimetable',
            name='group',
        ),
        
        # Step 5: Make batch field non-nullable
        migrations.AlterField(
            model_name='weeklytimetable',
            name='batch',
            field=models.ForeignKey(
                help_text='Batch this timetable is for',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='weekly_timetables',
                to='academics.batch'
            ),
        ),
        
        # Step 6: Update ordering
        migrations.AlterModelOptions(
            name='weeklytimetable',
            options={
                'ordering': ['week_start_date', 'batch'],
            },
        ),
        
        # Step 7: Add new indexes with batch
        migrations.AddIndex(
            model_name='weeklytimetable',
            index=models.Index(fields=['academic_period', 'batch', 'week_start_date'], name='timetable_w_academi_batch_idx'),
        ),
        
        # Step 8: Add new unique constraint with batch and academic_period
        migrations.AddConstraint(
            model_name='weeklytimetable',
            constraint=models.UniqueConstraint(fields=['batch', 'academic_period', 'week_start_date'], name='unique_weekly_timetable_per_batch_period_week'),
        ),
    ]
