# Generated manually on 2026-01-03
# Adds person field to Student model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0003_importjob"),
        ("people", "0001_initial"),  # Assuming people has initial migration
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="person",
            field=models.OneToOneField(
                blank=True,
                help_text="Linked person record for identity data",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="student",
                to="people.person",
            ),
        ),
    ]
