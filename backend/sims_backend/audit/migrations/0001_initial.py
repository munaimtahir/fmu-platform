import uuid

import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
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
                    "timestamp",
                    models.DateTimeField(
                        db_index=True, default=django.utils.timezone.now
                    ),
                ),
                ("method", models.CharField(max_length=16)),
                ("path", models.TextField()),
                ("status_code", models.PositiveIntegerField()),
                ("model", models.CharField(blank=True, max_length=255)),
                ("object_id", models.CharField(blank=True, max_length=255)),
                ("summary", models.TextField()),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="audit_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-timestamp"]},
        ),
    ]
