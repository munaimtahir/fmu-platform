from django.core.validators import MaxValueValidator, MinValueValidator
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
        related_name="students",
        help_text="Program the student is enrolled in",
    )
    batch_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text="Graduating year (batch year). For example, for MBBS 5-year program, if admitted in 2024, batch_year would be 2029",
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

    # Personal Information
    full_name = models.CharField(
        max_length=255,
        help_text="Full name of the applicant",
    )
    date_of_birth = models.DateField(help_text="Date of birth")
    email = models.EmailField(help_text="Email address")
    phone = models.CharField(max_length=20, help_text="Phone number")
    address = models.TextField(blank=True, help_text="Address")

    # Academic Information
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        related_name="applications",
        help_text="Program applied for",
    )
    batch_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
        help_text="Expected graduating year (batch year)",
    )
    previous_qualification = models.CharField(
        max_length=255,
        blank=True,
        help_text="Previous educational qualification",
    )
    previous_institution = models.CharField(
        max_length=255,
        blank=True,
        help_text="Previous institution name",
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
        help_text="Uploaded documents (certificates, transcripts, etc.)",
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
        return f"{self.full_name} - {self.program.name} ({self.get_status_display()})"

    def approve(self, user):
        """Approve the application and create a Student record"""
        if self.status != self.STATUS_PENDING:
            raise ValueError("Only pending applications can be approved")

        # Generate registration number (you may want to customize this logic)
        year_prefix = str(self.batch_year)[-2:]
        program_code = self.program.name[:4].upper()
        # Simple sequential number - in production, you'd want a better system
        count = StudentApplication.objects.filter(
            program=self.program, batch_year=self.batch_year, status=self.STATUS_APPROVED
        ).count()
        reg_no = f"{program_code}{year_prefix}{count + 1:04d}"

        # Create Student record
        student = Student.objects.create(
            reg_no=reg_no,
            name=self.full_name,
            program=self.program,
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
