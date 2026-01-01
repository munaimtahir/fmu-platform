# Migration to create StudentApplication model before 0005_add_registration_form_fields
# This is inserted between 0004 and 0005

from django.db import migrations, models
import django.core.validators
import django.core.files.storage


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0004_alter_student_created_at_alter_student_updated_at"),
        ("academics", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentApplication",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("full_name", models.CharField(blank=True, max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(max_length=20)),
                ("address", models.TextField(blank=True)),
                ("program", models.CharField(blank=True, max_length=128, null=True)),
                ("batch_year", models.PositiveSmallIntegerField(default=2029)),
                ("previous_qualification", models.CharField(blank=True, max_length=255)),
                ("previous_institution", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=32)),
                ("notes", models.TextField(blank=True)),
                ("documents", models.TextField(blank=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]

