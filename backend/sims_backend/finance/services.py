from __future__ import annotations

import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone

from sims_backend.academics.models import Program
from sims_backend.finance.models import (
    Adjustment,
    FeePlan,
    FeeType,
    FinancePolicy,
    LedgerEntry,
    Payment,
    Voucher,
    VoucherItem,
)
from sims_backend.students.models import Student


def _next_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def generate_voucher_number() -> str:
    return _next_code("VCH")


def generate_receipt_number() -> str:
    return _next_code("RCT")


@dataclass
class VoucherResult:
    voucher: Voucher
    created: bool


def is_term_locked(term, user=None) -> tuple[bool, str]:
    """Check if a term is locked (end_date in past). Admin can override."""
    if user and (user.is_superuser or hasattr(user, "groups") and user.groups.filter(name__in=["ADMIN", "Admin"]).exists()):
        return False, ""  # Admin can override
    
    if term.end_date and term.end_date < timezone.now().date():
        return True, f"Term {term.name} is locked (ended on {term.end_date}). Contact admin for override."
    return False, ""


def create_voucher_from_feeplan(
    student: Student,
    term,
    created_by,
    due_date,
    selected_fee_types: Optional[Iterable[int]] = None,
) -> VoucherResult:
    """Create a voucher (and ledger debit) from active fee plans for the student."""
    # Check term lock
    locked, message = is_term_locked(term, created_by)
    if locked:
        raise ValueError(message)
    
    fee_plans = FeePlan.objects.filter(program=student.program, term=term, is_active=True)
    if selected_fee_types:
        fee_plans = fee_plans.filter(fee_type_id__in=selected_fee_types)

    items = []
    total = Decimal("0.00")
    for plan in fee_plans:
        amount = Decimal(plan.amount)
        total += amount
        items.append({"fee_type": plan.fee_type, "description": plan.fee_type.name, "amount": amount})

    if not items:
        raise ValueError("No fee plans found for voucher generation.")

    with transaction.atomic():
        voucher = Voucher.objects.create(
            voucher_no=generate_voucher_number(),
            student=student,
            term=term,
            status=Voucher.STATUS_GENERATED,
            issue_date=timezone.now().date(),
            due_date=due_date,
            total_amount=total,
            created_by=created_by,
        )
        VoucherItem.objects.bulk_create(
            [
                VoucherItem(
                    voucher=voucher,
                    fee_type=item["fee_type"],
                    description=item["description"],
                    amount=item["amount"],
                )
                for item in items
            ]
        )
        LedgerEntry.objects.create(
            student=student,
            term=term,
            entry_type=LedgerEntry.ENTRY_DEBIT,
            amount=total,
            reference_type=LedgerEntry.REF_VOUCHER,
            reference_id=str(voucher.id),
            description=f"Voucher {voucher.voucher_no}",
            voucher=voucher,
            created_by=created_by,
        )
        reconcile_voucher_status(voucher)
    return VoucherResult(voucher=voucher, created=True)


def post_payment(
    student: Student,
    term,
    amount: Decimal,
    method: str,
    received_by,
    voucher: Voucher | None = None,
    reference_no: str | None = None,
) -> Payment:
    # Check term lock
    locked, message = is_term_locked(term, received_by)
    if locked:
        raise ValueError(message)
    
    # Check for duplicate receipt_no (shouldn't happen with UUID, but defensive)
    # Check for duplicate reference_no per method if provided
    if reference_no:
        existing = Payment.objects.filter(method=method, reference_no=reference_no, status=Payment.STATUS_VERIFIED)
        if existing.exists():
            raise ValueError(f"Duplicate reference number '{reference_no}' for method {method}")
    
    with transaction.atomic():
        payment = Payment.objects.create(
            receipt_no=generate_receipt_number(),
            student=student,
            term=term,
            voucher=voucher,
            amount=amount,
            method=method,
            reference_no=reference_no or "",
            received_by=received_by,
            status=Payment.STATUS_RECEIVED,
        )
    return payment


def verify_payment(payment: Payment, approved_by) -> Payment:
    if payment.status == Payment.STATUS_VERIFIED:
        return payment
    with transaction.atomic():
        payment.status = Payment.STATUS_VERIFIED
        payment.received_by = payment.received_by or approved_by
        payment.save(update_fields=["status", "received_by", "updated_at"])

        LedgerEntry.objects.create(
            student=payment.student,
            term=payment.term,
            entry_type=LedgerEntry.ENTRY_CREDIT,
            amount=payment.amount,
            reference_type=LedgerEntry.REF_PAYMENT,
            reference_id=str(payment.id),
            description=f"Payment {payment.receipt_no}",
            voucher=payment.voucher,
            created_by=approved_by,
        )
        if payment.voucher:
            reconcile_voucher_status(payment.voucher)
    return payment


def reject_payment(payment: Payment, rejected_by, reason: str | None = None) -> Payment:
    with transaction.atomic():
        payment.status = Payment.STATUS_REJECTED
        payment.notes = reason or payment.notes
        payment.save(update_fields=["status", "notes", "updated_at"])
        if payment.voucher:
            reconcile_voucher_status(payment.voucher)
    return payment


def reverse_payment(payment: Payment, reversed_by, reason: str) -> Payment:
    """Reverse a verified payment by creating a compensating ledger entry."""
    if payment.status != Payment.STATUS_VERIFIED:
        raise ValueError("Only verified payments can be reversed.")
    
    with transaction.atomic():
        # Create compensating ledger entry (debit to offset the credit)
        LedgerEntry.objects.create(
            student=payment.student,
            term=payment.term,
            entry_type=LedgerEntry.ENTRY_DEBIT,
            amount=payment.amount,
            reference_type=LedgerEntry.REF_REVERSAL,
            reference_id=str(payment.id),
            description=f"Reversal of payment {payment.receipt_no}: {reason}",
            voucher=payment.voucher,
            created_by=reversed_by,
        )
        
        # Update payment status (add reversed status if model supports it)
        # For now, we'll use notes to track reversal
        payment.notes = f"{payment.notes or ''}\n[REVERSED] {reason}".strip()
        payment.save(update_fields=["notes", "updated_at"])
        
        # Reconcile affected vouchers
        if payment.voucher:
            reconcile_voucher_status(payment.voucher)
    
    return payment


def cancel_voucher(voucher: Voucher, cancelled_by, reason: str) -> Voucher:
    """Cancel a voucher by creating reversal ledger entries."""
    if voucher.status == Voucher.STATUS_CANCELLED:
        return voucher
    
    with transaction.atomic():
        # Create reversal ledger entries for all debit entries linked to this voucher
        voucher_debits = LedgerEntry.objects.filter(
            voucher=voucher,
            entry_type=LedgerEntry.ENTRY_DEBIT,
            voided_at__isnull=True,
        )
        
        for debit_entry in voucher_debits:
            # Create compensating credit entry
            LedgerEntry.objects.create(
                student=voucher.student,
                term=voucher.term,
                entry_type=LedgerEntry.ENTRY_CREDIT,
                amount=debit_entry.amount,
                reference_type=LedgerEntry.REF_REVERSAL,
                reference_id=f"voucher_{voucher.id}",
                description=f"Cancellation of voucher {voucher.voucher_no}: {reason}",
                voucher=voucher,
                created_by=cancelled_by,
            )
        
        # Mark voucher as cancelled
        voucher.status = Voucher.STATUS_CANCELLED
        voucher.notes = f"{voucher.notes or ''}\n[CANCELLED] {reason}".strip()
        voucher.save(update_fields=["status", "notes", "updated_at"])
    
    return voucher


def approve_adjustment(adjustment: Adjustment, approver) -> Adjustment:
    if adjustment.status == Adjustment.STATUS_APPROVED:
        return adjustment
    with transaction.atomic():
        adjustment.status = Adjustment.STATUS_APPROVED
        adjustment.approved_by = approver
        adjustment.approved_at = timezone.now()
        adjustment.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        LedgerEntry.objects.create(
            student=adjustment.student,
            term=adjustment.term,
            entry_type=LedgerEntry.ENTRY_CREDIT,
            amount=adjustment.amount,
            reference_type=LedgerEntry.REF_ADJUSTMENT,
            reference_id=str(adjustment.id),
            description=f"Adjustment ({adjustment.kind})",
            created_by=approver,
        )
    return adjustment


def compute_student_balance(student: Student, term=None, voucher: Voucher | None = None) -> dict:
    qs = LedgerEntry.objects.filter(student=student)
    if term:
        qs = qs.filter(term=term)
    if voucher:
        qs = qs.filter(voucher=voucher)
    qs = qs.filter(voided_at__isnull=True)

    totals = qs.values("entry_type").annotate(total=Sum("amount"))
    debit = next((t["total"] for t in totals if t["entry_type"] == LedgerEntry.ENTRY_DEBIT), Decimal("0"))
    credit = next((t["total"] for t in totals if t["entry_type"] == LedgerEntry.ENTRY_CREDIT), Decimal("0"))
    debit = debit or Decimal("0")
    credit = credit or Decimal("0")
    balance = debit - credit
    return {
        "student_id": student.id,
        "term_id": term.id if term else None,
        "outstanding": balance,
        "total_debits": debit,
        "total_credits": credit,
    }


def reconcile_voucher_status(voucher: Voucher) -> Voucher:
    summary = compute_student_balance(voucher.student, term=voucher.term, voucher=voucher)
    outstanding = summary["outstanding"]
    total = voucher.total_amount
    if voucher.status == Voucher.STATUS_CANCELLED:
        return voucher

    if outstanding <= 0:
        voucher.status = Voucher.STATUS_PAID
    elif outstanding < total:
        voucher.status = Voucher.STATUS_PARTIAL
    else:
        # consider overdue
        if voucher.due_date < timezone.now().date():
            voucher.status = Voucher.STATUS_OVERDUE
        else:
            voucher.status = Voucher.STATUS_GENERATED
    voucher.save(update_fields=["status", "updated_at"])
    return voucher


def finance_gate_checks(student: Student, term) -> dict:
    balance = compute_student_balance(student, term)
    policies = FinancePolicy.objects.filter(is_active=True)
    gating = {
        "can_view_transcript": True,
        "can_view_results": True,
        "can_enroll_next_term": True,
        "reasons": [],
    }

    outstanding = balance["outstanding"]
    for policy in policies:
        if policy.rule_key.upper() == "BLOCK_TRANSCRIPT_IF_DUES":
            if outstanding > policy.threshold_amount:
                gating["can_view_transcript"] = False
                gating["reasons"].append("Transcript blocked: outstanding dues exceed threshold.")
        if policy.rule_key.upper() == "BLOCK_RESULTS_IF_DUES":
            if outstanding > policy.threshold_amount:
                gating["can_view_results"] = False
                gating["reasons"].append("Results blocked: outstanding dues exceed threshold.")
        if policy.rule_key.upper() == "BLOCK_ENROLLMENT_IF_DUES":
            if outstanding > policy.threshold_amount:
                gating["can_enroll_next_term"] = False
                gating["reasons"].append("Enrollment blocked until dues cleared.")
    balance["gating"] = gating
    return balance


def defaulters(program: Program | None, term, min_outstanding: Decimal) -> list[dict]:
    students = Student.objects.all()
    if program:
        students = students.filter(program=program)

    # Aggregate outstanding balances for all relevant students in a single query
    student_ids = list(students.values_list("id", flat=True))
    outstanding_by_student_id: dict[int, Decimal] = {}
    if student_ids:
        # Calculate outstanding: debits - credits per student
        debits = (
            LedgerEntry.objects.filter(
                student_id__in=student_ids, term=term, entry_type=LedgerEntry.ENTRY_DEBIT, voided_at__isnull=True
            )
            .values("student_id")
            .annotate(total=Sum("amount"))
        )
        credits = (
            LedgerEntry.objects.filter(
                student_id__in=student_ids, term=term, entry_type=LedgerEntry.ENTRY_CREDIT, voided_at__isnull=True
            )
            .values("student_id")
            .annotate(total=Sum("amount"))
        )
        debit_map = {row["student_id"]: row["total"] or Decimal("0") for row in debits}
        credit_map = {row["student_id"]: row["total"] or Decimal("0") for row in credits}
        for sid in student_ids:
            outstanding_by_student_id[sid] = debit_map.get(sid, Decimal("0")) - credit_map.get(sid, Decimal("0"))

    rows = []
    for student in students:
        outstanding = outstanding_by_student_id.get(student.id, Decimal("0"))
        if outstanding >= min_outstanding:
            # Get latest voucher and overdue days
            latest_voucher = (
                Voucher.objects.filter(student=student, term=term, status__in=[Voucher.STATUS_GENERATED, Voucher.STATUS_OVERDUE, Voucher.STATUS_PARTIAL])
                .order_by("-due_date")
                .first()
            )
            overdue_days = 0
            if latest_voucher and latest_voucher.due_date < timezone.now().date():
                overdue_days = (timezone.now().date() - latest_voucher.due_date).days
            
            rows.append(
                {
                    "student_id": student.id,
                    "reg_no": student.reg_no,
                    "name": student.name,
                    "outstanding": outstanding,
                    "overdue_days": overdue_days,
                    "latest_voucher_no": latest_voucher.voucher_no if latest_voucher else None,
                    "phone": getattr(student, "phone", "") or "",
                    "email": student.email or "",
                }
            )
    return rows


def collection_report(start_date, end_date) -> dict:
    """Daily collection report grouped by payment method."""
    payments = Payment.objects.filter(
        status=Payment.STATUS_VERIFIED,
        received_at__date__gte=start_date,
        received_at__date__lte=end_date,
    )
    
    total_collected = payments.aggregate(total=Sum("amount")).get("total") or Decimal("0")
    total_count = payments.count()
    
    # Group by method
    by_method = payments.values("method").annotate(
        total=Sum("amount"),
        count=Count("id")
    )
    
    method_totals = {}
    for item in by_method:
        method_totals[item["method"]] = {
            "total": item["total"] or Decimal("0"),
            "count": item["count"],
        }
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_collected": total_collected,
        "total_count": total_count,
        "by_method": method_totals,
    }


def aging_report(term=None) -> dict:
    """Aging report with buckets: 0-7, 8-30, 31-60, 60+ days."""
    from datetime import date, timedelta
    
    vouchers = Voucher.objects.filter(status__in=[Voucher.STATUS_GENERATED, Voucher.STATUS_OVERDUE, Voucher.STATUS_PARTIAL])
    if term:
        vouchers = vouchers.filter(term=term)
    
    today = timezone.now().date()
    buckets = {
        "0_7": {"count": 0, "amount": Decimal("0")},
        "8_30": {"count": 0, "amount": Decimal("0")},
        "31_60": {"count": 0, "amount": Decimal("0")},
        "60_plus": {"count": 0, "amount": Decimal("0")},
    }
    
    for voucher in vouchers:
        # Calculate days since due date (or issue date if not overdue yet)
        if voucher.due_date < today:
            days_overdue = (today - voucher.due_date).days
        else:
            days_overdue = 0
        
        # Get outstanding for this voucher
        balance = compute_student_balance(voucher.student, term=voucher.term, voucher=voucher)
        outstanding = balance["outstanding"]
        
        if outstanding <= 0:
            continue  # Skip paid vouchers
        
        if days_overdue <= 7:
            bucket = "0_7"
        elif days_overdue <= 30:
            bucket = "8_30"
        elif days_overdue <= 60:
            bucket = "31_60"
        else:
            bucket = "60_plus"
        
        buckets[bucket]["count"] += 1
        buckets[bucket]["amount"] += outstanding
    
    return {
        "term_id": term.id if term else None,
        "term_name": term.name if term else "All Terms",
        "buckets": buckets,
    }


def student_statement(student: Student, term=None) -> dict:
    """Student ledger statement with chronological entries and running totals."""
    entries = LedgerEntry.objects.filter(student=student, voided_at__isnull=True)
    if term:
        entries = entries.filter(term=term)
    entries = entries.select_related("term", "voucher", "created_by").order_by("created_at")
    
    statement_entries = []
    running_balance = Decimal("0")
    
    for entry in entries:
        if entry.entry_type == LedgerEntry.ENTRY_DEBIT:
            running_balance += entry.amount
        else:
            running_balance -= entry.amount
        
        statement_entries.append({
            "date": entry.created_at.date(),
            "description": entry.description,
            "entry_type": entry.entry_type,
            "debit": entry.amount if entry.entry_type == LedgerEntry.ENTRY_DEBIT else None,
            "credit": entry.amount if entry.entry_type == LedgerEntry.ENTRY_CREDIT else None,
            "reference_type": entry.reference_type,
            "reference_id": entry.reference_id,
            "voucher_no": entry.voucher.voucher_no if entry.voucher else None,
            "running_balance": running_balance,
        })
    
    # Calculate opening and closing balances
    opening_balance = Decimal("0")
    if term:
        # Opening balance = sum of entries before this term
        opening_entries = LedgerEntry.objects.filter(
            student=student,
            voided_at__isnull=True,
            created_at__lt=term.start_date if term.start_date else timezone.now(),
        )
        opening_debits = opening_entries.filter(entry_type=LedgerEntry.ENTRY_DEBIT).aggregate(total=Sum("amount")).get("total") or Decimal("0")
        opening_credits = opening_entries.filter(entry_type=LedgerEntry.ENTRY_CREDIT).aggregate(total=Sum("amount")).get("total") or Decimal("0")
        opening_balance = opening_debits - opening_credits
    
    closing_balance = running_balance
    
    return {
        "student_id": student.id,
        "student_name": student.name,
        "student_reg_no": student.reg_no,
        "term_id": term.id if term else None,
        "term_name": term.name if term else "All Time",
        "opening_balance": opening_balance,
        "closing_balance": closing_balance,
        "entries": statement_entries,
    }
