from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

from core.models import TimeStampedModel


class ChargeTemplate(TimeStampedModel):
    """Template for generating charges"""

    FREQUENCY_BLOCK = "BLOCK"
    FREQUENCY_MONTH = "MONTH"
    FREQUENCY_TERM = "TERM"
    FREQUENCY_YEAR = "YEAR"

    FREQUENCY_CHOICES = [
        (FREQUENCY_BLOCK, "Block"),
        (FREQUENCY_MONTH, "Month"),
        (FREQUENCY_TERM, "Term"),
        (FREQUENCY_YEAR, "Year"),
    ]

    AUTO_GENERATE_MANUAL_WITH_REMINDER = "MANUAL_WITH_REMINDER"
    AUTO_GENERATE_ALL_NOW = "GENERATE_ALL_NOW"
    AUTO_GENERATE_REMIND_THEN_GENERATE = "REMIND_THEN_GENERATE"

    AUTO_GENERATE_CHOICES = [
        (AUTO_GENERATE_MANUAL_WITH_REMINDER, "Manual with Reminder"),
        (AUTO_GENERATE_ALL_NOW, "Generate All Now"),
        (AUTO_GENERATE_REMIND_THEN_GENERATE, "Remind Then Generate"),
    ]

    title_template = models.CharField(
        max_length=255,
        help_text="Title template (supports placeholders like {academic_period}, {batch})",
    )
    default_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Default charge amount",
    )
    frequency_unit = models.CharField(
        max_length=16,
        choices=FREQUENCY_CHOICES,
        help_text="Frequency unit for charge generation",
    )
    frequency_interval = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Frequency interval (e.g., every 2 blocks)",
    )
    auto_generate_mode = models.CharField(
        max_length=32,
        choices=AUTO_GENERATE_CHOICES,
        default=AUTO_GENERATE_MANUAL_WITH_REMINDER,
        help_text="How charges should be generated",
    )

    class Meta:
        ordering = ["title_template"]

    def __str__(self):
        return f"{self.title_template} ({self.default_amount})"


class Charge(TimeStampedModel):
    """Charge instance"""

    title = models.CharField(
        max_length=255,
        help_text="Charge title",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Charge amount",
    )
    due_date = models.DateField(
        help_text="Due date for this charge",
    )
    academic_period = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="charges",
        null=True,
        blank=True,
        help_text="Academic period this charge is for (optional)",
    )
    template = models.ForeignKey(
        ChargeTemplate,
        on_delete=models.SET_NULL,
        related_name="charges",
        null=True,
        blank=True,
        help_text="Template used to generate this charge (optional)",
    )

    class Meta:
        ordering = ["-due_date", "title"]
        indexes = [
            models.Index(fields=["due_date"]),
            models.Index(fields=["academic_period"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.amount} (Due: {self.due_date})"


class StudentLedgerItem(TimeStampedModel):
    """Ledger item linking a student to a charge"""

    STATUS_PENDING = "PENDING"
    STATUS_PAID = "PAID"
    STATUS_WAIVED = "WAIVED"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_WAIVED, "Waived"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="ledger_items",
        help_text="Student this ledger item is for",
    )
    charge = models.ForeignKey(
        Charge,
        on_delete=models.PROTECT,
        related_name="ledger_items",
        help_text="Charge this ledger item is for",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Status of this ledger item",
    )

    class Meta:
        unique_together = [("student", "charge")]
        ordering = ["student", "-charge__due_date"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["charge", "status"]),
        ]

    def __str__(self):
        return f"{self.student.reg_no} - {self.charge.title} ({self.get_status_display()})"


class Challan(TimeStampedModel):
    """Challan for payment"""

    STATUS_PENDING = "PENDING"
    STATUS_PAID = "PAID"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    challan_no = models.CharField(
        max_length=64,
        unique=True,
        help_text="Unique challan number",
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="challans",
        help_text="Student this challan is for",
    )
    ledger_item = models.ForeignKey(
        StudentLedgerItem,
        on_delete=models.PROTECT,
        related_name="challans",
        help_text="Ledger item this challan is for",
    )
    amount_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Total amount in this challan",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        help_text="Challan status",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["challan_no"]),
            models.Index(fields=["student", "status"]),
        ]

    def __str__(self):
        return f"{self.challan_no} - {self.student.reg_no} ({self.amount_total})"


class PaymentLog(TimeStampedModel):
    """Payment log entry"""

    challan = models.ForeignKey(
        Challan,
        on_delete=models.PROTECT,
        related_name="payment_logs",
        help_text="Challan this payment is for",
    )
    received = models.BooleanField(
        default=True,
        help_text="Whether payment was received",
    )
    received_at = models.DateTimeField(
        default=timezone.now,
        help_text="When payment was received",
    )
    amount_received = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Amount received",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="logged_payments",
        null=True,
        help_text="User who logged this payment",
    )
    remarks = models.TextField(
        blank=True,
        help_text="Payment remarks/notes",
    )

    class Meta:
        ordering = ["-received_at"]
        indexes = [
            models.Index(fields=["challan"]),
            models.Index(fields=["received_at"]),
        ]

    def __str__(self):
        return f"{self.challan.challan_no} - {self.amount_received} ({self.received_at})"

