from django.db import migrations

from core.rbac_catalog import seed_rbac_catalog


def seed_forward(apps, schema_editor):
    seed_rbac_catalog(apps)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_permissiontask_role_roletaskassignment_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_forward, migrations.RunPython.noop),
    ]
