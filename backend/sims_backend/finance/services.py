from __future__ import annotations

import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, Optional

from django.db import transaction
from django.db.models import Sum
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


def create_voucher_from_feeplan(
    student: Student,
    term,
    created_by,
    due_date,
    selected_fee_types: Optional[Iterable[int]] = None,
) -> VoucherResult:
    """Create a voucher (and ledger debit) from active fee plans for the student."""
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

    rows = []
    for student in students:
        summary = compute_student_balance(student, term)
        if summary["outstanding"] >= min_outstanding:
            rows.append(
                {
                    "student_id": student.id,
                    "reg_no": student.reg_no,
                    "name": student.name,
                    "outstanding": summary["outstanding"],
                }
            )
    return rows
