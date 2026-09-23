import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("people", "0002_rename_people_address_person_3c4d5e_idx_people_addr_person__61177a_idx_and_more")]

    operations = [
        migrations.AlterField(
            model_name="person",
            name="user",
            field=models.OneToOneField(
                help_text="Canonical account linked to this identity",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="person",
                to="auth.user",
            ),
        ),
        migrations.CreateModel(
            name="EmergencyContact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("name", models.CharField(max_length=255)),
                ("phone", models.CharField(max_length=20)),
                ("relationship", models.CharField(blank=True, max_length=100)),
                (
                    "person",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="emergency_contact",
                        to="people.person",
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        )
    ]
