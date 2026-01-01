import uuid
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class Student(TimeStampedModel):
    """Student record in the system"""

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_GRADUATED = "graduated"
    STATUS_SUSPENDED = "suspended"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
        (STATUS_GRADUATED, "Graduated"),
        (STATUS_SUSPENDED, "Suspended"),
    ]

    reg_no = models.CharField(
        max_length=32,
        unique=True,
        help_text="Student registration number",
    )
    name = models.CharField(max_length=255, help_text="Full name of the student")
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        related_name="admission_students",  # Changed to avoid conflict with students.Student
        help_text="Program the student is enrolled in",
    )
    batch_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text=(
            "Graduating year (batch year). For example, for an MBBS 5-year program, "
            "if admitted in 2024, batch_year would be 2029. The default value of 2029 "
            "is used for legacy data corresponding to this initial cohort and should "
            "normally be overridden by application logic when creating new students."
        ),
        default=2029,
    )
    current_year = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Current academic year in the program (1-10)",
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        help_text="Current status of the student",
    )
    email = models.EmailField(
        blank=True,
        help_text="Student email address",
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Student phone number",
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Student date of birth",
    )

    class Meta:
        ordering = ["reg_no"]
        indexes = [
            models.Index(fields=["program", "batch_year"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.reg_no} - {self.name} ({self.program.name}, Batch {self.batch_year})"


class StudentApplication(TimeStampedModel):
    """Student application submitted through public form (pending admin approval)"""

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    GUARDIAN_RELATION_CHOICES = [
        ("FATHER", "Father"),
        ("MOTHER", "Mother"),
        ("GUARDIAN", "Guardian"),
        ("OTHER", "Other"),
    ]

    # Personal Information
    full_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Full name of the applicant (legacy field, use first_name + last_name)",
    )
    first_name = models.CharField(
        max_length=255,
        help_text="First name of the applicant",
    )
    last_name = models.CharField(
        max_length=255,
        help_text="Last name of the applicant",
    )
    father_name = models.CharField(
        max_length=255,
        help_text="Father's name",
    )
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        help_text="Gender",
    )
    date_of_birth = models.DateField(help_text="Date of birth", default="2000-01-01")
    cnic = models.CharField(
        max_length=15,
        help_text="CNIC number in format 12345-123456-1",
    )
    email = models.EmailField(help_text="Email address")
    phone = models.CharField(max_length=20, help_text="Phone number")
    
    # Detailed Address
    address_city = models.CharField(max_length=100, help_text="City")
    address_district = models.CharField(max_length=100, help_text="District")
    address_state = models.CharField(max_length=100, help_text="State/Province")
    address_country = models.CharField(max_length=100, default="Pakistan", help_text="Country")
    address = models.TextField(blank=True, help_text="Full address (legacy field)")
    
    # Mailing Address
    mailing_address_same = models.BooleanField(
        default=True,
        help_text="Mailing address same as permanent address",
    )
    mailing_address = models.TextField(blank=True, help_text="Mailing address")
    mailing_city = models.CharField(max_length=100, blank=True, help_text="Mailing city")
    mailing_district = models.CharField(max_length=100, blank=True, help_text="Mailing district")
    mailing_state = models.CharField(max_length=100, blank=True, help_text="Mailing state/province")
    mailing_country = models.CharField(max_length=100, blank=True, default="Pakistan", help_text="Mailing country")
    
    # Guardian Information
    guardian_name = models.CharField(max_length=255, help_text="Guardian name")
    guardian_relation = models.CharField(
        max_length=20,
        choices=GUARDIAN_RELATION_CHOICES,
        help_text="Relation to guardian",
    )
    guardian_phone = models.CharField(max_length=20, help_text="Guardian phone number")
    guardian_email = models.EmailField(help_text="Guardian email address")
    guardian_mailing_address = models.TextField(help_text="Guardian mailing address")

    # Academic Information
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        related_name="applications",
        null=True,
        blank=True,
        help_text="Program applied for (defaults to MBBS)",
    )
    batch_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text="Expected graduating year (batch year)",
    )
    previous_qualification = models.CharField(
        max_length=255,
        blank=True,
        help_text="Previous educational qualification (legacy field)",
    )
    previous_institution = models.CharField(
        max_length=255,
        blank=True,
        help_text="Previous institution name (legacy field)",
    )
    
    # Admission/Merit Details
    mdcat_roll_number = models.CharField(
        max_length=50,
        help_text="MDCAT roll number",
    )
    merit_number = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Merit number",
    )
    merit_percentage = models.DecimalField(
        max_digits=7,
        decimal_places=4,
        validators=[MinValueValidator(0.0000), MaxValueValidator(100.0000)],
        help_text="Merit percentage (up to 4 decimal places)",
    )
    
    # Qualification - HSSC/Intermediate
    hssc_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2100)],
        help_text="HSSC/Intermediate passing year",
    )
    hssc_board = models.CharField(max_length=100, help_text="HSSC/Intermediate board")
    hssc_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="HSSC/Intermediate total marks",
    )
    hssc_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.00), MaxValueValidator(100.00)],
        help_text="HSSC/Intermediate percentage",
    )
    
    # Qualification - SSC
    ssc_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2100)],
        help_text="SSC/Matric passing year",
    )
    ssc_board = models.CharField(max_length=100, help_text="SSC/Matric board")
    ssc_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="SSC/Matric total marks",
    )
    ssc_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.00), MaxValueValidator(100.00)],
        help_text="SSC/Matric percentage",
    )

    # Application Status
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Application status",
    )
    notes = models.TextField(
        blank=True,
        help_text="Admin notes about the application",
    )

    # File Uploads
    documents = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        blank=True,
        null=True,
        help_text="Uploaded documents (legacy field)",
    )
    father_id_card = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="Father ID card",
    )
    guardian_id_card = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="Guardian ID card (required if guardian is not father)",
    )
    domicile = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="Domicile certificate",
    )
    ssc_certificate = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="SSC/Matric certificate",
    )
    hssc_certificate = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="HSSC/FSC certificate",
    )
    mdcat_result = models.FileField(
        upload_to="student_applications/documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="MDCAT result/screenshot",
    )

    # Admin tracking
    reviewed_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_applications",
        help_text="Admin user who reviewed this application",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the application was reviewed",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["program", "batch_year"]),
        ]

    def __str__(self) -> str:
        name = f"{self.first_name} {self.last_name}" if self.first_name and self.last_name else self.full_name
        program_name = self.program.name if self.program else "MBBS"
        return f"{name} - {program_name} ({self.get_status_display()})"

    def approve(self, user):
        """Approve the application and create a Student record"""
        if self.status != self.STATUS_PENDING:
            raise ValueError("Only pending applications can be approved")

        # Generate registration number (you may want to customize this logic)
        year_prefix = str(self.batch_year)[-2:]
        program = self.program
        if not program:
            # Default to MBBS if program is not set
            from academics.models import Program
            program = Program.objects.filter(name__icontains='mbbs').first()
            if not program:
                raise ValueError("No MBBS program found. Please set a program for this application.")
        
        program_code = program.name[:4].upper()
        # Simple sequential number - in production, you'd want a better system
        count = StudentApplication.objects.filter(
            program=program, batch_year=self.batch_year, status=self.STATUS_APPROVED
        ).count()
        reg_no = f"{program_code}{year_prefix}{count + 1:04d}"

        # Create Student record
        # Use first_name + last_name if available, otherwise fall back to full_name
        student_name = f"{self.first_name} {self.last_name}".strip() if (self.first_name and self.last_name) else self.full_name
        
        student = Student.objects.create(
            reg_no=reg_no,
            name=student_name,
            program=program,
            batch_year=self.batch_year,
            current_year=1,  # New students start in year 1
            status=Student.STATUS_ACTIVE,
            email=self.email,
            phone=self.phone,
            date_of_birth=self.date_of_birth,
        )

        # Update application status
        self.status = self.STATUS_APPROVED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.save()

        return student

    def reject(self, user, reason=""):
        """Reject the application"""
        if self.status != self.STATUS_PENDING:
            raise ValueError("Only pending applications can be rejected")

        self.status = self.STATUS_REJECTED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        if reason:
            self.notes = f"{self.notes}\nRejection reason: {reason}".strip()
        self.save()


class ApplicationDraft(TimeStampedModel):
    """Draft application form data - allows students to save progress and return later"""
    
    STATUS_DRAFT = "DRAFT"
    STATUS_SUBMITTED = "SUBMITTED"
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SUBMITTED, "Submitted"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        db_index=True,
        help_text="Email address (normalized to lowercase, used as identifier)"
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        help_text="Draft status - DRAFT allows edits, SUBMITTED is locked"
    )
    form_data = models.JSONField(
        default=dict,
        help_text="All form field data (text/number fields) stored as JSON"
    )
    uploaded_files = models.JSONField(
        default=dict,
        help_text="File metadata and storage paths for uploaded documents"
    )
    last_saved_at = models.DateTimeField(
        auto_now=True,
        help_text="Last time the draft was saved"
    )
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the draft was submitted (locked)"
    )
    
    class Meta:
        ordering = ["-last_saved_at"]
        indexes = [
            models.Index(fields=["email", "status"]),
            models.Index(fields=["status"]),
        ]
        verbose_name = "Application Draft"
        verbose_name_plural = "Application Drafts"
    
    def __str__(self) -> str:
        return f"Draft for {self.email} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Normalize email to lowercase and ensure only one DRAFT per email"""
        # Normalize email
        if self.email:
            self.email = self.email.strip().lower()
        
        # If this is a new DRAFT, delete any existing DRAFT for this email
        if self.status == self.STATUS_DRAFT:
            ApplicationDraft.objects.filter(
                email=self.email,
                status=self.STATUS_DRAFT
            ).exclude(pk=self.pk).delete()
        
        # Set submitted_at when status changes to SUBMITTED
        if self.status == self.STATUS_SUBMITTED and not self.submitted_at:
            self.submitted_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def can_edit(self):
        """Check if draft can be edited"""
        return self.status == self.STATUS_DRAFT
    
    @classmethod
    def get_draft_for_email(cls, email):
        """Get the active DRAFT for an email, or None if not found"""
        if not email:
            return None
        normalized_email = email.strip().lower()
        return cls.objects.filter(
            email=normalized_email,
            status=cls.STATUS_DRAFT
        ).first()
