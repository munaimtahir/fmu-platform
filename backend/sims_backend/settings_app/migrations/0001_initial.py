# Generated manually for settings_app
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AppSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('key', models.CharField(help_text='Setting key (must be in allowlist)', max_length=100, unique=True)),
                ('value_json', models.JSONField(help_text='Setting value (JSON-serializable)')),
                ('value_type', models.CharField(choices=[('boolean', 'Boolean'), ('integer', 'Integer'), ('string', 'String'), ('json', 'JSON')], help_text='Type of the value', max_length=20)),
                ('description', models.TextField(blank=True, help_text='Description of this setting')),
                ('updated_by', models.ForeignKey(blank=True, help_text='User who last updated this setting', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_settings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['key'],
            },
        ),
        migrations.AddIndex(
            model_name='appsetting',
            index=models.Index(fields=['key'], name='settings_ap_key_idx'),
        ),
    ]
