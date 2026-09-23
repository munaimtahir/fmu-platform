import django.db.models.deletion
from django.db import migrations, models
import sims_backend.private_storage
import sims_backend.compliance.models


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0009_alter_batch_start_year"),
        ("compliance", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="requirementdefinition", name="is_active", field=models.BooleanField(default=True)),
        migrations.AddField(
            model_name="requirementdefinition",
            name="is_onboarding_required",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(model_name="requirementinstance", name="is_active", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="requirementinstance", name="assignment_source", field=models.CharField(choices=[("onboarding_scope", "Onboarding scope"), ("manual", "Manual")], default="manual", max_length=24)),
        migrations.AddField(model_name="requirementsubmission", name="original_filename", field=models.CharField(blank=True, max_length=255)),
        migrations.AlterField(model_name="requirementsubmission", name="file", field=models.FileField(blank=True, null=True, storage=sims_backend.private_storage.PrivateMediaStorage(), upload_to=sims_backend.compliance.models.compliance_document_path)),
        migrations.CreateModel(
            name="RequirementScope",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")),
                ("updated_at", models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")),
                ("scope_type", models.CharField(choices=[("global", "Global"), ("program", "Program"), ("batch", "Batch")], max_length=16)),
                ("is_active", models.BooleanField(default=True)),
                ("batch", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="requirement_scopes", to="academics.batch")),
                ("definition", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="scopes", to="compliance.requirementdefinition")),
                ("program", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="requirement_scopes", to="academics.program")),
            ],
        ),
        migrations.AddConstraint(model_name="requirementscope", constraint=models.CheckConstraint(condition=models.Q(models.Q(("batch__isnull", True), ("program__isnull", True), ("scope_type", "global")), models.Q(("batch__isnull", True), ("program__isnull", False), ("scope_type", "program")), models.Q(("batch__isnull", False), ("program__isnull", True), ("scope_type", "batch")), _connector="OR"), name="valid_requirement_scope_shape")),
        migrations.AddConstraint(model_name="requirementscope", constraint=models.UniqueConstraint(condition=models.Q(("scope_type", "global")), fields=("definition",), name="unique_global_requirement_scope")),
        migrations.AddConstraint(model_name="requirementscope", constraint=models.UniqueConstraint(condition=models.Q(("scope_type", "program")), fields=("definition", "program"), name="unique_program_requirement_scope")),
        migrations.AddConstraint(model_name="requirementscope", constraint=models.UniqueConstraint(condition=models.Q(("scope_type", "batch")), fields=("definition", "batch"), name="unique_batch_requirement_scope")),
    ]
