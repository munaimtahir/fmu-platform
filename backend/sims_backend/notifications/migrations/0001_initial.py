from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("academics", "0009_alter_batch_start_year"),
        ("students", "0006_importjob_auto_create"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(help_text="Notification title", max_length=255)),
                ("body", models.TextField(help_text="Notification body")),
                ("category", models.CharField(help_text="Notification category", max_length=64)),
                (
                    "priority",
                    models.CharField(
                        choices=[("LOW", "Low"), ("NORMAL", "Normal"), ("HIGH", "High"), ("URGENT", "Urgent")],
                        default="NORMAL",
                        help_text="Notification priority",
                        max_length=16,
                    ),
                ),
                (
                    "send_email",
                    models.BooleanField(default=False, help_text="Also send email notifications"),
                ),
                ("publish_at", models.DateTimeField(blank=True, null=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("DRAFT", "Draft"),
                            ("QUEUED", "Queued"),
                            ("SENT", "Sent"),
                            ("FAILED", "Failed"),
                        ],
                        default="DRAFT",
                        max_length=16,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="created_notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="NotificationDeliveryLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "channel",
                    models.CharField(choices=[("IN_APP", "In-app"), ("EMAIL", "Email")], max_length=16),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("SENT", "Sent"), ("FAILED", "Failed")],
                        default="PENDING",
                        max_length=16,
                    ),
                ),
                ("target_count", models.PositiveIntegerField(default=0)),
                ("success_count", models.PositiveIntegerField(default=0)),
                ("failure_count", models.PositiveIntegerField(default=0)),
                ("error_sample", models.TextField(blank=True, null=True)),
                ("job_id", models.CharField(blank=True, max_length=64, null=True)),
                (
                    "notification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="delivery_logs",
                        to="notifications.notification",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="NotificationInbox",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("delivered_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("is_deleted", models.BooleanField(default=False)),
                (
                    "notification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inbox_entries",
                        to="notifications.notification",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_inbox",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-delivered_at"],
                "unique_together": {("notification", "user")},
            },
        ),
        migrations.CreateModel(
            name="NotificationAudience",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "audience_type",
                    models.CharField(
                        choices=[
                            ("STUDENT", "Student"),
                            ("ALL_STUDENTS", "All Students"),
                            ("SECTION", "Section"),
                            ("BATCH", "Batch"),
                            ("PROGRAM", "Program"),
                            ("GROUP", "Group"),
                        ],
                        max_length=32,
                    ),
                ),
                ("filters_json", models.JSONField(blank=True, null=True)),
                (
                    "batch",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_audiences",
                        to="academics.batch",
                    ),
                ),
                (
                    "group",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_audiences",
                        to="academics.group",
                    ),
                ),
                (
                    "notification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="audiences",
                        to="notifications.notification",
                    ),
                ),
                (
                    "program",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_audiences",
                        to="academics.program",
                    ),
                ),
                (
                    "section",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_audiences",
                        to="academics.section",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_audiences",
                        to="students.student",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["status"], name="notificatio_status_5cc05d_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["category"], name="notificatio_category_124229_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["created_by"], name="notificatio_created_4cbedc_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationaudience",
            index=models.Index(fields=["audience_type"], name="notificatio_audience_9a9a0c_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationinbox",
            index=models.Index(fields=["user", "read_at"], name="notificatio_user_rea_0e078d_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationinbox",
            index=models.Index(fields=["user", "is_deleted"], name="notificatio_user_is__b33e7f_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationdeliverylog",
            index=models.Index(fields=["channel", "status"], name="notificatio_channel_315efa_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationdeliverylog",
            index=models.Index(fields=["notification"], name="notificatio_notific_6d24ae_idx"),
        ),
    ]
