# Generated manually for registration form fields

from django.db import migrations, models
import django.core.validators
import django.core.files.storage


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0004_5_create_studentapplication"),
        ("academics", "0001_initial"),
    ]

    operations = [
        # Make full_name optional and add first_name, last_name
        migrations.AlterField(
            model_name="studentapplication",
            name="full_name",
            field=models.CharField(blank=True, help_text="Full name of the applicant (legacy field, use first_name + last_name)", max_length=255),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="first_name",
            field=models.CharField(default="", help_text="First name of the applicant", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="last_name",
            field=models.CharField(default="", help_text="Last name of the applicant", max_length=255),
            preserve_default=False,
        ),
        # Add personal information fields
        migrations.AddField(
            model_name="studentapplication",
            name="father_name",
            field=models.CharField(default="", help_text="Father's name", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="gender",
            field=models.CharField(choices=[("M", "Male"), ("F", "Female"), ("O", "Other")], default="M", help_text="Gender", max_length=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="cnic",
            field=models.CharField(default="", help_text="CNIC number in format 12345-123456-1", max_length=15),
            preserve_default=False,
        ),
        # Add detailed address fields
        migrations.AddField(
            model_name="studentapplication",
            name="address_city",
            field=models.CharField(default="", help_text="City", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="address_district",
            field=models.CharField(default="", help_text="District", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="address_state",
            field=models.CharField(default="", help_text="State/Province", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="address_country",
            field=models.CharField(default="Pakistan", help_text="Country", max_length=100),
        ),
        # Add mailing address fields
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_address_same",
            field=models.BooleanField(default=True, help_text="Mailing address same as permanent address"),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_address",
            field=models.TextField(blank=True, help_text="Mailing address"),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_city",
            field=models.CharField(blank=True, help_text="Mailing city", max_length=100),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_district",
            field=models.CharField(blank=True, help_text="Mailing district", max_length=100),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_state",
            field=models.CharField(blank=True, help_text="Mailing state/province", max_length=100),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mailing_country",
            field=models.CharField(blank=True, default="Pakistan", help_text="Mailing country", max_length=100),
        ),
        # Add guardian information fields
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_name",
            field=models.CharField(default="", help_text="Guardian name", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_relation",
            field=models.CharField(choices=[("FATHER", "Father"), ("MOTHER", "Mother"), ("GUARDIAN", "Guardian"), ("OTHER", "Other")], default="FATHER", help_text="Relation to guardian", max_length=20),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_phone",
            field=models.CharField(default="", help_text="Guardian phone number", max_length=20),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_email",
            field=models.EmailField(default="", help_text="Guardian email address", max_length=254),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_mailing_address",
            field=models.TextField(default="", help_text="Guardian mailing address"),
            preserve_default=False,
        ),
        # Add admission/merit details
        migrations.AddField(
            model_name="studentapplication",
            name="mdcat_roll_number",
            field=models.CharField(default="", help_text="MDCAT roll number", max_length=50),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="merit_number",
            field=models.IntegerField(default=1, help_text="Merit number", validators=[django.core.validators.MinValueValidator(1)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="merit_percentage",
            field=models.DecimalField(decimal_places=4, default=0.0, help_text="Merit percentage (up to 4 decimal places)", max_digits=7, validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)]),
            preserve_default=False,
        ),
        # Add HSSC qualification fields
        migrations.AddField(
            model_name="studentapplication",
            name="hssc_year",
            field=models.PositiveSmallIntegerField(default=2020, help_text="HSSC/Intermediate passing year", validators=[django.core.validators.MinValueValidator(1900), django.core.validators.MaxValueValidator(2100)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="hssc_board",
            field=models.CharField(default="", help_text="HSSC/Intermediate board", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="hssc_marks",
            field=models.IntegerField(default=0, help_text="HSSC/Intermediate total marks", validators=[django.core.validators.MinValueValidator(0)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="hssc_percentage",
            field=models.DecimalField(decimal_places=2, default=0.0, help_text="HSSC/Intermediate percentage", max_digits=5, validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)]),
            preserve_default=False,
        ),
        # Add SSC qualification fields
        migrations.AddField(
            model_name="studentapplication",
            name="ssc_year",
            field=models.PositiveSmallIntegerField(default=2020, help_text="SSC/Matric passing year", validators=[django.core.validators.MinValueValidator(1900), django.core.validators.MaxValueValidator(2100)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="ssc_board",
            field=models.CharField(default="", help_text="SSC/Matric board", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="ssc_marks",
            field=models.IntegerField(default=0, help_text="SSC/Matric total marks", validators=[django.core.validators.MinValueValidator(0)]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="ssc_percentage",
            field=models.DecimalField(decimal_places=2, default=0.0, help_text="SSC/Matric percentage", max_digits=5, validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(100.0)]),
            preserve_default=False,
        ),
        # Change program from CharField to ForeignKey
        migrations.RemoveField(
            model_name="studentapplication",
            name="program",
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="program",
            field=models.ForeignKey(blank=True, help_text="Program applied for (defaults to MBBS)", null=True, on_delete=models.PROTECT, related_name="applications", to="academics.program"),
        ),
        # Add document fields
        migrations.AddField(
            model_name="studentapplication",
            name="father_id_card",
            field=models.FileField(default="", help_text="Father ID card", upload_to="student_applications/documents/%Y/%m/%d/"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="guardian_id_card",
            field=models.FileField(blank=True, help_text="Guardian ID card (required if guardian is not father)", null=True, upload_to="student_applications/documents/%Y/%m/%d/"),
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="domicile",
            field=models.FileField(default="", help_text="Domicile certificate", upload_to="student_applications/documents/%Y/%m/%d/"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="ssc_certificate",
            field=models.FileField(default="", help_text="SSC/Matric certificate", upload_to="student_applications/documents/%Y/%m/%d/"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="hssc_certificate",
            field=models.FileField(default="", help_text="HSSC/FSC certificate", upload_to="student_applications/documents/%Y/%m/%d/"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="studentapplication",
            name="mdcat_result",
            field=models.FileField(default="", help_text="MDCAT result/screenshot", upload_to="student_applications/documents/%Y/%m/%d/"),
            preserve_default=False,
        ),
    ]

