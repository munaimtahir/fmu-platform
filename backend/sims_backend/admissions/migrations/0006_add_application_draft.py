# Generated manually for ApplicationDraft model

from django.db import migrations, models
import uuid
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0005_add_registration_form_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationDraft",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        help_text="The timestamp when the record was created.",
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                        help_text="The timestamp when the record was last updated.",
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        db_index=True,
                        help_text="Email address (normalized to lowercase, used as identifier)",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted")],
                        default="DRAFT",
                        help_text="Draft status - DRAFT allows edits, SUBMITTED is locked",
                        max_length=32,
                    ),
                ),
                (
                    "form_data",
                    models.JSONField(
                        default=dict,
                        help_text="All form field data (text/number fields) stored as JSON",
                    ),
                ),
                (
                    "uploaded_files",
                    models.JSONField(
                        default=dict,
                        help_text="File metadata and storage paths for uploaded documents",
                    ),
                ),
                (
                    "last_saved_at",
                    models.DateTimeField(
                        auto_now=True,
                        help_text="Last time the draft was saved",
                    ),
                ),
                (
                    "submitted_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When the draft was submitted (locked)",
                        null=True,
                    ),
                ),
            ],
            options={
                "verbose_name": "Application Draft",
                "verbose_name_plural": "Application Drafts",
                "ordering": ["-last_saved_at"],
            },
        ),
        migrations.AddIndex(
            model_name="applicationdraft",
            index=models.Index(
                fields=["email", "status"], name="admissions_a_email_8a3b2d_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="applicationdraft",
            index=models.Index(fields=["status"], name="admissions_a_status_9c4e5f_idx"),
        ),
    ]
