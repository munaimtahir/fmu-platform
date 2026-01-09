# Generated manually for syllabus app
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SyllabusItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('title', models.CharField(help_text='Syllabus item title', max_length=255)),
                ('code', models.CharField(blank=True, help_text='Optional syllabus item code', max_length=32)),
                ('description', models.TextField(blank=True, help_text='Description of the syllabus item')),
                ('learning_objectives', models.TextField(blank=True, help_text='Learning objectives for this item')),
                ('order_no', models.PositiveIntegerField(default=1, help_text='Order/sequence number (>= 1)')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this syllabus item is active')),
                ('learning_block', models.ForeignKey(blank=True, help_text='Learning block this syllabus item belongs to', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='syllabus_items', to='academics.learningblock')),
                ('module', models.ForeignKey(blank=True, help_text='Module this syllabus item belongs to', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='syllabus_items', to='academics.module')),
                ('period', models.ForeignKey(blank=True, help_text='Period this syllabus item belongs to', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='syllabus_items', to='academics.period')),
                ('program', models.ForeignKey(blank=True, help_text='Program this syllabus item belongs to (top level)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='syllabus_items', to='academics.program')),
            ],
            options={
                'ordering': ['order_no', 'title'],
            },
        ),
        migrations.AddIndex(
            model_name='syllabusitem',
            index=models.Index(fields=['program', 'is_active'], name='syllabus_syll_program_idx'),
        ),
        migrations.AddIndex(
            model_name='syllabusitem',
            index=models.Index(fields=['period', 'is_active'], name='syllabus_syll_period_idx'),
        ),
        migrations.AddIndex(
            model_name='syllabusitem',
            index=models.Index(fields=['learning_block', 'is_active'], name='syllabus_syll_block_idx'),
        ),
        migrations.AddIndex(
            model_name='syllabusitem',
            index=models.Index(fields=['module', 'is_active'], name='syllabus_syll_module_idx'),
        ),
        migrations.AddIndex(
            model_name='syllabusitem',
            index=models.Index(fields=['order_no'], name='syllabus_syll_order_idx'),
        ),
    ]
