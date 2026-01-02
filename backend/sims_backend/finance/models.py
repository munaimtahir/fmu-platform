from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

from core.models import TimeStampedModel

# Maximum allowed voucher amount to prevent database overflow
MAX_VOUCHER_AMOUNT = Decimal("9999999999.99")


class FeeType(TimeStampedModel):
    """Reference table for fee categories (tuition, exam, library, etc.)."""

    code = models.CharField(
        max_length=32,
        unique=True,
        help_text="Unique fee type code (e.g., TUITION, EXAM, LIBRARY)",
    )
    name = models.CharField(max_length=128, help_text="Human readable fee type name")
    is_active = models.BooleanField(default=True, help_text="Whether this fee type can be used")

    class Meta:
        ordering = ["code"]
        indexes = [models.Index(fields=["is_active"])]

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class FeePlan(TimeStampedModel):
    """Defines fee amounts for a program + term + fee type combination."""

    FREQ_ONE_TIME = "one_time"
    FREQ_PER_TERM = "per_term"
    FREQUENCY_CHOICES = [
        (FREQ_ONE_TIME, "One-time"),
        (FREQ_PER_TERM, "Per term"),
    ]

    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.PROTECT,
        related_name="fee_plans",
        help_text="Program the plan applies to",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="fee_plans",
        help_text="Term/academic period the plan applies to",
    )
    fee_type = models.ForeignKey(
        FeeType,
        on_delete=models.PROTECT,
        related_name="fee_plans",
        help_text="Fee type covered by this plan",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Fee amount for this plan",
    )
    is_mandatory = models.BooleanField(default=True, help_text="Whether this fee is mandatory")
    frequency = models.CharField(max_length=16, choices=FREQUENCY_CHOICES, default=FREQ_ONE_TIME)
    effective_from = models.DateField(null=True, blank=True, help_text="Optional effective start date")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["program", "term", "fee_type"]
        constraints = [
            models.UniqueConstraint(
                fields=["program", "term", "fee_type"],
                condition=Q(is_active=True),
                name="uniq_active_feeplan",
            )
        ]

    def __str__(self) -> str:
        return f"{self.program} - {self.term} - {self.fee_type} ({self.amount})"


class Voucher(TimeStampedModel):
    """Payment request grouping voucher items for a student."""

    STATUS_GENERATED = "generated"
    STATUS_PARTIAL = "partially_paid"
    STATUS_PAID = "paid"
    STATUS_OVERDUE = "overdue"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_GENERATED, "Generated"),
        (STATUS_PARTIAL, "Partially Paid"),
        (STATUS_PAID, "Paid"),
        (STATUS_OVERDUE, "Overdue"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    voucher_no = models.CharField(max_length=64, unique=True, help_text="Readable voucher number")
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="vouchers",
        help_text="Student this voucher belongs to",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="vouchers",
        help_text="Term for which the voucher is issued",
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_GENERATED)
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(MAX_VOUCHER_AMOUNT)],
        help_text="Snapshot total for printing (truth derived from ledger)",
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_vouchers",
    )

    class Meta:
        ordering = ["-issue_date", "voucher_no"]
        indexes = [
            models.Index(fields=["student", "term"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.voucher_no} - {self.student.reg_no}"


class VoucherItem(TimeStampedModel):
    """Line item on a voucher."""

    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Voucher this line item belongs to",
    )
    fee_type = models.ForeignKey(
        FeeType,
        on_delete=models.PROTECT,
        related_name="voucher_items",
        help_text="Fee type for this line",
    )
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    metadata = models.JSONField(null=True, blank=True, help_text="Optional metadata for integrations")

    class Meta:
        ordering = ["voucher", "fee_type"]

    def __str__(self) -> str:
        return f"{self.voucher.voucher_no} - {self.fee_type.code} ({self.amount})"


class LedgerEntry(TimeStampedModel):
    """Source-of-truth ledger entry."""

    ENTRY_DEBIT = "debit"
    ENTRY_CREDIT = "credit"
    ENTRY_CHOICES = [
        (ENTRY_DEBIT, "Debit"),
        (ENTRY_CREDIT, "Credit"),
    ]

    REF_VOUCHER = "voucher"
    REF_PAYMENT = "payment"
    REF_ADJUSTMENT = "adjustment"
    REF_WAIVER = "waiver"
    REF_SCHOLARSHIP = "scholarship"
    REF_REVERSAL = "reversal"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        help_text="Student the entry belongs to",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        help_text="Term/academic period for the entry",
    )
    entry_type = models.CharField(max_length=8, choices=ENTRY_CHOICES)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    currency = models.CharField(max_length=8, default="PKR")
    reference_type = models.CharField(
        max_length=32,
        choices=[
            (REF_VOUCHER, "Voucher"),
            (REF_PAYMENT, "Payment"),
            (REF_ADJUSTMENT, "Adjustment"),
            (REF_WAIVER, "Waiver"),
            (REF_SCHOLARSHIP, "Scholarship"),
            (REF_REVERSAL, "Reversal"),
        ],
    )
    reference_id = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries_created",
    )
    voided_at = models.DateTimeField(null=True, blank=True)
    void_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "term"]),
            models.Index(fields=["reference_type", "reference_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.student.reg_no} {self.entry_type} {self.amount}"


class Payment(TimeStampedModel):
    """Payment against a voucher or open credit."""

    METHOD_CASH = "cash"
    METHOD_BANK_TRANSFER = "bank_transfer"
    METHOD_ONLINE = "online"
    METHOD_SCHOLARSHIP = "scholarship"
    METHOD_WAIVER = "waiver"

    STATUS_RECEIVED = "received"
    STATUS_VERIFIED = "verified"
    STATUS_REJECTED = "rejected"

    receipt_no = models.CharField(max_length=64, unique=True)
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    method = models.CharField(
        max_length=32,
        choices=[
            (METHOD_CASH, "Cash"),
            (METHOD_BANK_TRANSFER, "Bank Transfer"),
            (METHOD_ONLINE, "Online"),
            (METHOD_SCHOLARSHIP, "Scholarship"),
            (METHOD_WAIVER, "Waiver"),
        ],
    )
    reference_no = models.CharField(max_length=128, blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments_received",
    )
    received_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=16, choices=[(STATUS_RECEIVED, "Received"), (STATUS_VERIFIED, "Verified"), (STATUS_REJECTED, "Rejected")], default=STATUS_RECEIVED)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-received_at", "-created_at"]
        indexes = [
            models.Index(fields=["student", "term"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.receipt_no} - {self.student.reg_no}"


class Adjustment(TimeStampedModel):
    """Waiver/Scholarship/Adjustment that results in a credit after approval."""

    KIND_WAIVER = "waiver"
    KIND_SCHOLARSHIP = "scholarship"
    KIND_ADJUSTMENT = "adjustment"
    KIND_FINE_REVERSAL = "fine_reversal"

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="adjustments",
    )
    term = models.ForeignKey(
        "academics.AcademicPeriod",
        on_delete=models.PROTECT,
        related_name="adjustments",
    )
    kind = models.CharField(
        max_length=32,
        choices=[
            (KIND_WAIVER, "Waiver"),
            (KIND_SCHOLARSHIP, "Scholarship"),
            (KIND_ADJUSTMENT, "Adjustment"),
            (KIND_FINE_REVERSAL, "Fine Reversal"),
        ],
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    reason = models.TextField()
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="adjustments_requested",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="adjustments_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=[(STATUS_PENDING, "Pending"), (STATUS_APPROVED, "Approved"), (STATUS_REJECTED, "Rejected")],
        default=STATUS_PENDING,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["student", "term", "status"])]

    def __str__(self) -> str:
        return f"{self.student.reg_no} {self.kind} {self.amount} ({self.status})"


class FinancePolicy(TimeStampedModel):
    """Configurable finance gating policy."""

    rule_key = models.CharField(max_length=128, unique=True)
    description = models.TextField(blank=True)
    threshold_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    fee_type = models.ForeignKey(
        FeeType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="policies",
        help_text="Optional scope to a specific fee type",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["rule_key"]

    def __str__(self) -> str:
        return f"{self.rule_key} ({'active' if self.is_active else 'inactive'})"
