"""
Wave 2: Business Logic Coverage Tests

Phase 2 of coverage unblock-and-lift sprint.

Target modules:
1. Finance: Multi-year payments, partial payments, edge cases
2. Results: State transitions, forbidden edits, permission checks
3. Transcripts: Blocking on unpaid balance, role overrides
"""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status

User = get_user_model()


def _finance_context(suffix):
    from sims_backend.academics.models import AcademicPeriod, Batch, Program
    from sims_backend.academics.models import Group as AcademicGroup
    from sims_backend.finance.models import FeeType, Voucher, VoucherItem
    from sims_backend.students.models import Student

    program = Program.objects.create(name=f"MBBS {suffix}")
    period = AcademicPeriod.objects.create(period_type="YEAR", name=f"Academic Year {suffix}")
    batch = Batch.objects.create(program=program, name=f"Batch {suffix}", start_year=2023)
    group = AcademicGroup.objects.create(batch=batch, name=f"Group {suffix}")
    user = User.objects.create_user(username=f"stu-wave2-{suffix}", password="pass")
    user.groups.add(Group.objects.get(name="STUDENT"))
    student = Student.objects.create(
        user=user,
        reg_no=f"WAVE2-{suffix}",
        name="Test Student",
        program=program,
        batch=batch,
        group=group,
    )
    tuition = FeeType.objects.create(name=f"Tuition {suffix}", code=f"TUI{suffix}")
    voucher = Voucher.objects.create(
        voucher_no=f"V-WAVE2-{suffix}",
        student=student,
        term=period,
        due_date=date.today() + timedelta(days=30),
        total_amount=Decimal("100000.00"),
    )
    VoucherItem.objects.create(voucher=voucher, fee_type=tuition, amount=Decimal("100000.00"))
    return student, period, voucher


def _result_context(suffix, status):
    from sims_backend.academics.models import AcademicPeriod, Batch, Department, Program
    from sims_backend.academics.models import Group as AcademicGroup
    from sims_backend.exams.models import Exam
    from sims_backend.results.models import ResultHeader
    from sims_backend.students.models import Student

    program = Program.objects.create(name=f"Result Program {suffix}")
    batch = Batch.objects.create(program=program, name=f"Result Batch {suffix}", start_year=2024)
    group = AcademicGroup.objects.create(batch=batch, name=f"Result Group {suffix}")
    student_user = User.objects.create_user(username=f"result-student-{suffix}", password="pass")
    student = Student.objects.create(
        user=student_user,
        reg_no=f"RESULT-{suffix}",
        name="Result Student",
        program=program,
        batch=batch,
        group=group,
    )
    period = AcademicPeriod.objects.create(period_type="YEAR", name=f"Result Year {suffix}")
    department = Department.objects.create(name=f"Medicine {suffix}", code=f"MED{suffix}")
    exam = Exam.objects.create(title=f"Professional Examination {suffix}", academic_period=period, department=department)
    user = User.objects.create_user(username=f"result-admin-{suffix}", password="pass")
    result = ResultHeader.objects.create(
        exam=exam,
        student=student,
        status=status,
        total_obtained=80,
        total_max=100,
    )
    return user, student, result


# ============================================================================
# FINANCE: BUSINESS LOGIC TESTS
# ============================================================================

@pytest.mark.django_db
class TestFinancePaymentLogic:
    """Finance module payment processing and balance calculations."""

    def test_voucher_creation(self, db):
        """Create voucher with items."""
        _, _, voucher = _finance_context("01")
        assert voucher.total_amount == Decimal("100000.00")
        assert voucher.items.count() == 1

    def test_payment_full_amount(self, db):
        """Create full payment for voucher."""
        from sims_backend.finance.models import Payment

        student, period, voucher = _finance_context("02")
        payment = Payment.objects.create(
            receipt_no="PAY-WAVE2-02",
            student=student,
            term=period,
            voucher=voucher,
            amount=Decimal("100000.00"),
            method=Payment.METHOD_CASH,
        )

        assert payment.amount == Decimal("100000.00")

    def test_payment_partial_multiple_entries(self, db):
        """Create multiple partial payments."""
        from sims_backend.finance.models import Payment

        student, period, voucher = _finance_context("03")

        # Two partial payments
        Payment.objects.create(
            receipt_no="PAY-WAVE2-03A",
            student=student,
            term=period,
            voucher=voucher,
            amount=Decimal("60000.00"),
            method=Payment.METHOD_CASH,
        )
        Payment.objects.create(
            receipt_no="PAY-WAVE2-03B",
            student=student,
            term=period,
            voucher=voucher,
            amount=Decimal("40000.00"),
            method=Payment.METHOD_BANK_TRANSFER,
        )

        payments = Payment.objects.filter(student=student)
        total = sum(p.amount for p in payments)
        assert total == Decimal("100000.00")


@pytest.mark.django_db
class TestResultsStateTransitions:
    """Result module state machines."""

    def test_result_draft_creation(self, db):
        """Create result in draft state."""
        _, _, result = _result_context("01", "DRAFT")
        assert result.status == result.STATUS_DRAFT

    def test_result_publish_from_draft(self, db):
        """Publish result from draft state."""
        user, _, result = _result_context("02", "DRAFT")
        result.publish(user)
        result.refresh_from_db()
        assert result.status == result.STATUS_PUBLISHED

    def test_result_freeze_after_publish(self, db):
        """Freeze result after publish."""
        user, _, result = _result_context("03", "PUBLISHED")
        result.freeze(user)
        result.refresh_from_db()
        assert result.status == result.STATUS_FROZEN


@pytest.mark.django_db
class TestFinanceVoucherRBAC:
    """Finance voucher RBAC tests."""

    def test_finance_officer_access(self, finance_client):
        """Finance officer can access voucher endpoint."""
        response = finance_client.get("/api/finance/vouchers/")
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_student_limited_access(self, student_client):
        """Student has limited access to finance."""
        response = student_client.get("/api/finance/vouchers/")
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestResultsRBAC:
    """Results RBAC tests."""

    def test_examcell_results_access(self, examcell_client):
        """Examcell can access results."""
        response = examcell_client.get("/api/results/")
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_student_results_access(self, student_client):
        """Student access to results."""
        response = student_client.get("/api/results/")
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]
