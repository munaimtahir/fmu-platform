from datetime import timedelta

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models
import sims_backend.private_storage


def default_import_expiry():
    return django.utils.timezone.now() + timedelta(hours=24)


class Migration(migrations.Migration):
    dependencies = [("students", "0006_importjob_auto_create")]

    operations = [
        migrations.AlterField(
            model_name="student",
            name="group",
            field=models.ForeignKey(
                blank=True,
                help_text="Group the student belongs to",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="students",
                to="academics.group",
            ),
        ),
        migrations.AlterField(
            model_name="student",
            name="user",
            field=models.OneToOneField(
                help_text="Canonical student login account",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="student",
                to="auth.user",
            ),
        ),
        migrations.AlterField(
            model_name="student",
            name="person",
            field=models.OneToOneField(
                help_text="Canonical student identity record",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="student",
                to="people.person",
            ),
        ),
        migrations.RemoveField(model_name="student", name="name"),
        migrations.RemoveField(model_name="student", name="email"),
        migrations.RemoveField(model_name="student", name="phone"),
        migrations.RemoveField(model_name="student", name="date_of_birth"),
        migrations.AddField(
            model_name="student",
            name="password_change_required",
            field=models.BooleanField(
                default=True,
                help_text="Whether the student must change a temporary password before normal access",
            ),
        ),
        migrations.AddField(
            model_name="student",
            name="credential_version",
            field=models.PositiveIntegerField(
                default=1,
                help_text="Incremented whenever student credentials change to invalidate older tokens",
            ),
        ),
        migrations.RemoveIndex(model_name="importjob", name="students_im_file_ha_c584d0_idx"),
        migrations.RemoveField(model_name="importjob", name="mode"),
        migrations.RemoveField(model_name="importjob", name="auto_create"),
        migrations.RemoveField(model_name="importjob", name="file"),
        migrations.AddField(
            model_name="importjob",
            name="unchanged_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Number of rows that exactly matched an existing provisioned student",
            ),
        ),
        migrations.AddField(
            model_name="importjob",
            name="expires_at",
            field=models.DateTimeField(default=default_import_expiry, help_text="Preview expiry after which the source file must be previewed again"),
            preserve_default=False,
        ),
        migrations.RemoveField(model_name="importjob", name="updated_count"),
        migrations.AlterField(model_name="importjob", name="error_report_file", field=models.FileField(blank=True, help_text="CSV file containing invalid rows with error messages", null=True, storage=sims_backend.private_storage.PrivateMediaStorage(), upload_to="imports/students/errors/%Y/%m/%d/")),
        migrations.AddIndex(model_name="importjob", index=models.Index(fields=["file_hash"], name="students_im_file_ha_c35cc2_idx")),
        migrations.AddConstraint(
            model_name="student",
            constraint=models.UniqueConstraint(
                models.functions.Lower("reg_no"),
                name="student_reg_no_case_insensitive_unique",
            ),
        ),
    ]
