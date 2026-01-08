# Generated manually for people app initial migration
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
            name='Person',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('first_name', models.CharField(help_text='First/given name', max_length=100)),
                ('middle_name', models.CharField(blank=True, help_text='Middle name(s)', max_length=100)),
                ('last_name', models.CharField(help_text='Last/family name', max_length=100)),
                ('date_of_birth', models.DateField(blank=True, help_text='Date of birth', null=True)),
                ('gender', models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other'), ('prefer_not_to_say', 'Prefer not to say')], help_text='Gender', max_length=20)),
                ('national_id', models.CharField(blank=True, help_text='National ID / CNIC / Passport number', max_length=50, null=True, unique=True)),
                ('photo', models.ImageField(blank=True, help_text='Profile photo', null=True, upload_to='people/photos/')),
                ('user', models.OneToOneField(blank=True, help_text='Linked user account (optional)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='person', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['last_name', 'first_name'],
                'verbose_name_plural': 'People',
                'indexes': [
                    models.Index(fields=['last_name', 'first_name'], name='people_pers_last_na_idx'),
                    models.Index(fields=['national_id'], name='people_pers_nationa_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='ContactInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('type', models.CharField(choices=[('phone', 'Phone'), ('email', 'Email'), ('emergency_contact', 'Emergency Contact'), ('whatsapp', 'WhatsApp')], help_text='Type of contact information', max_length=20)),
                ('value', models.CharField(help_text='Contact value (phone number, email, etc.)', max_length=255)),
                ('label', models.CharField(blank=True, help_text="Optional label (e.g., 'Work', 'Home')", max_length=50)),
                ('is_primary', models.BooleanField(default=False, help_text='Is this the primary contact for this type?')),
                ('is_verified', models.BooleanField(default=False, help_text='Has this contact been verified?')),
                ('person', models.ForeignKey(help_text='Person this contact info belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='contact_info', to='people.person')),
            ],
            options={
                'ordering': ['-is_primary', 'type', 'label'],
                'verbose_name_plural': 'Contact Information',
                'indexes': [
                    models.Index(fields=['person', 'type'], name='people_cont_person__idx'),
                    models.Index(fields=['type', 'value'], name='people_cont_type_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('type', models.CharField(choices=[('mailing', 'Mailing Address'), ('permanent', 'Permanent Address'), ('temporary', 'Temporary Address'), ('work', 'Work Address')], help_text='Type of address', max_length=20)),
                ('street', models.CharField(help_text='Street address', max_length=255)),
                ('city', models.CharField(help_text='City', max_length=100)),
                ('state', models.CharField(blank=True, help_text='State/Province', max_length=100)),
                ('postal_code', models.CharField(blank=True, help_text='Postal/ZIP code', max_length=20)),
                ('country', models.CharField(default='Pakistan', help_text='Country', max_length=100)),
                ('is_primary', models.BooleanField(default=False, help_text='Is this the primary address?')),
                ('person', models.ForeignKey(help_text='Person this address belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='addresses', to='people.person')),
            ],
            options={
                'ordering': ['-is_primary', 'type'],
                'verbose_name_plural': 'Addresses',
                'indexes': [
                    models.Index(fields=['person', 'type'], name='people_addr_person__idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='IdentityDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='The timestamp when the record was created.')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='The timestamp when the record was last updated.')),
                ('type', models.CharField(choices=[('cnic', 'CNIC'), ('passport', 'Passport'), ('driving_license', 'Driving License'), ('other', 'Other')], help_text='Type of identity document', max_length=20)),
                ('document_number', models.CharField(help_text='Document number', max_length=100)),
                ('issue_date', models.DateField(blank=True, help_text='Date of issue', null=True)),
                ('expiry_date', models.DateField(blank=True, help_text='Expiry date', null=True)),
                ('issuing_authority', models.CharField(blank=True, help_text='Issuing authority', max_length=255)),
                ('document_file', models.FileField(blank=True, help_text='Scanned copy of the document', null=True, upload_to='people/documents/')),
                ('is_verified', models.BooleanField(default=False, help_text='Has this document been verified?')),
                ('person', models.ForeignKey(help_text='Person this document belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='identity_documents', to='people.person')),
            ],
            options={
                'ordering': ['type', '-issue_date'],
                'unique_together': {('person', 'type', 'document_number')},
                'indexes': [
                    models.Index(fields=['person', 'type'], name='people_iden_person__idx'),
                    models.Index(fields=['document_number'], name='people_iden_documen_idx'),
                ],
            },
        ),
    ]
