# Generated manually on 2026-01-09
# Adds Period, Track, LearningBlock, and Module models

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0003_program_structure_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Period",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("name", models.CharField(help_text="Period name (e.g., 'Year 1', 'Semester 1', 'Period 1')", max_length=128)),
                ("order", models.PositiveSmallIntegerField(help_text="Order/sequence of this period within the program")),
                ("start_date", models.DateField(blank=True, help_text="Period start date", null=True)),
                ("end_date", models.DateField(blank=True, help_text="Period end date", null=True)),
                (
                    "program",
                    models.ForeignKey(
                        help_text="Program this period belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="periods",
                        to="academics.program",
                    ),
                ),
            ],
            options={
                "ordering": ["program", "order"],
            },
        ),
        migrations.CreateModel(
            name="Track",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("name", models.CharField(help_text="Track name (e.g., 'Track A', 'Clinical Track')", max_length=128)),
                ("description", models.TextField(blank=True, help_text="Track description")),
                (
                    "program",
                    models.ForeignKey(
                        help_text="Program this track belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracks",
                        to="academics.program",
                    ),
                ),
            ],
            options={
                "ordering": ["program", "name"],
            },
        ),
        migrations.CreateModel(
            name="LearningBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("name", models.CharField(help_text="Block name", max_length=128)),
                (
                    "block_type",
                    models.CharField(
                        choices=[("INTEGRATED_BLOCK", "Integrated Block"), ("ROTATION_BLOCK", "Rotation Block")],
                        help_text="Type of learning block",
                        max_length=32,
                    ),
                ),
                ("start_date", models.DateField(help_text="Block start date")),
                ("end_date", models.DateField(help_text="Block end date")),
                (
                    "period",
                    models.ForeignKey(
                        help_text="Period this block belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="blocks",
                        to="academics.period",
                    ),
                ),
                (
                    "primary_department",
                    models.ForeignKey(
                        blank=True,
                        help_text="Primary department (required for ROTATION_BLOCK)",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="primary_rotation_blocks",
                        to="academics.department",
                    ),
                ),
                (
                    "sub_department",
                    models.ForeignKey(
                        blank=True,
                        help_text="Sub-department (must be child of primary_department if present)",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="sub_rotation_blocks",
                        to="academics.department",
                    ),
                ),
                (
                    "track",
                    models.ForeignKey(
                        help_text="Track this block belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="blocks",
                        to="academics.track",
                    ),
                ),
            ],
            options={
                "ordering": ["period", "track", "start_date"],
            },
        ),
        migrations.CreateModel(
            name="Module",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("name", models.CharField(help_text="Module name", max_length=128)),
                ("description", models.TextField(blank=True, help_text="Module description")),
                ("order", models.PositiveSmallIntegerField(help_text="Order/sequence of this module within the block")),
                (
                    "block",
                    models.ForeignKey(
                        help_text="Integrated block this module belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="modules",
                        to="academics.learningblock",
                    ),
                ),
            ],
            options={
                "ordering": ["block", "order"],
            },
        ),
        migrations.AddConstraint(
            model_name="period",
            constraint=models.UniqueConstraint(fields=("program", "name"), name="academics_period_program_name_unique"),
        ),
        migrations.AddConstraint(
            model_name="period",
            constraint=models.UniqueConstraint(fields=("program", "order"), name="academics_period_program_order_unique"),
        ),
        migrations.AddConstraint(
            model_name="track",
            constraint=models.UniqueConstraint(fields=("program", "name"), name="academics_track_program_name_unique"),
        ),
        migrations.AddConstraint(
            model_name="module",
            constraint=models.UniqueConstraint(fields=("block", "name"), name="academics_module_block_name_unique"),
        ),
        migrations.AddConstraint(
            model_name="module",
            constraint=models.UniqueConstraint(fields=("block", "order"), name="academics_module_block_order_unique"),
        ),
    ]
