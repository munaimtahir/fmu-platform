# Generated manually to add missing audit fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0002_auditlog_request_data_alter_auditlog_actor_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditlog',
            name='entity',
            field=models.CharField(blank=True, help_text='Entity/model name (if applicable)', max_length=255),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='entity_id',
            field=models.CharField(blank=True, help_text='Entity object ID (if applicable)', max_length=255),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='action',
            field=models.CharField(choices=[('create', 'Create'), ('update', 'Update'), ('delete', 'Delete'), ('state_transition', 'State Transition'), ('special_action', 'Special Action')], default='create', help_text='Type of action performed', max_length=32),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='metadata',
            field=models.JSONField(blank=True, help_text='Additional metadata (request data, old/new values, etc.)', null=True),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='ip_address',
            field=models.GenericIPAddressField(blank=True, help_text='IP address of the request', null=True),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='user_agent',
            field=models.CharField(blank=True, help_text='User agent string', max_length=512),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['entity', 'entity_id'], name='audit_audit_entity_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['action'], name='audit_audit_action_789abc_idx'),
        ),
    ]
