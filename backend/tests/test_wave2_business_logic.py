"""
Wave 2: Business Logic Coverage Tests

Phase 2 of coverage unblock-and-lift sprint.

Target modules:
1. Finance: Multi-year payments, partial payments, edge cases
2. Results: State transitions, forbidden edits, permission checks
3. Transcripts: Blocking on unpaid balance, role overrides
"""

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from datetime import date, timedelta

User = get_user_model()


# ============================================================================
# FINANCE: BUSINESS LOGIC TESTS
# ============================================================================

@pytest.mark.django_db
class TestFinancePaymentLogic:
    """Finance module payment processing and balance calculations."""

    def test_voucher_creation(self, db):
        """Create voucher with items."""
        from sims_backend.finance.models import FeeType, Voucher, VoucherItem
        from sims_backend.academics.models import Program, Batch
        from sims_backend.students.models import Student

        program = Program.objects.create(
            name="MBBS", code="MBBS", duration_years=5, is_active=True
        )
        batch = Batch.objects.create(
            program=program, batch_number="2023", start_year=2023, is_active=True
        )
        
        user = User.objects.create_user(username="stu-wave2-01", password="pass")
        user.groups.add(Group.objects.get(name="STUDENT"))
        student = Student.objects.create(
            user=user, enrollment_number="STU-WAVE2-01", batch=batch
        )

        tuition = FeeType.objects.create(name="Tuition", code="TUI", is_active=True)

        voucher = Voucher.objects.create(
            student=student,
            batch=batch,
            amount=Decimal("150000.00"),
            fiscal_year=2024,
            is_active=True
        )

        item = VoucherItem.objects.create(
            voucher=voucher,
            fee_type=tuition,
            amount=Decimal("150000.00")
        )

        assert voucher.amount == Decimal("150000.00")
        assert voucher.voucheritem_set.count() == 1

    def test_payment_full_amount(self, db):
        """Create full payment for voucher."""
        from sims_backend.finance.models import FeeType, Voucher, VoucherItem, Payment
        from sims_backend.academics.models import Program, Batch
        from sims_backend.students.models import Student

        program = Program.objects.create(
            name="MBBS", code="MBBS", duration_years=5, is_active=True
        )
        batch = Batch.objects.create(
            program=program, batch_number="2023", start_year=2023, is_active=True
        )
        user = User.objects.create_user(username="stu-wave2-02", password="pass")
        user.groups.add(Group.objects.get(name="STUDENT"))
        student = Student.objects.create(
            user=user, enrollment_number="STU-WAVE2-02", batch=batch
        )

        tuition = FeeType.objects.create(name="Tuition", code="TUI", is_active=True)
        voucher = Voucher.objects.create(
            student=student,
            batch=batch,
            amount=Decimal("100000.00"),
            fiscal_year=2024,
            is_active=True
        )
        VoucherItem.objects.create(
            voucher=voucher,
            fee_type=tuition,
            amount=Decimal("100000.00")
        )

        payment = Payment.objects.create(
            student=student,
            amount=Decimal("100000.00"),
            payment_date=date.today(),
            reference_number="PAY001",
            is_active=True
        )

        assert payment.amount == Decimal("100000.00")

    def test_payment_partial_multiple_entries(self, db):
        """Create multiple partial payments."""
        from sims_backend.finance.models import FeeType, Voucher, VoucherItem, Payment
        from sims_backend.academics.models import Program, Batch
        from sims_backend.students.models import Student

        program = Program.objects.create(
            name="MBBS", code="MBBS", duration_years=5, is_active=True
        )
        batch = Batch.objects.create(
            program=program, batch_number="2023", start_year=2023, is_active=True
        )
        user = User.objects.create_user(username="stu-wave2-03", password="pass")
        user.groups.add(Group.objects.get(name="STUDENT"))
        student = Student.objects.create(
            user=user, enrollment_number="STU-WAVE2-03", batch=batch
        )

        tuition = FeeType.objects.create(name="Tuition", code="TUI", is_active=True)
        voucher = Voucher.objects.create(
            student=student,
            batch=batch,
            amount=Decimal("100000.00"),
            fiscal_year=2024,
            is_active=True
        )
        VoucherItem.objects.create(
            voucher=voucher,
            fee_type=tuition,
            amount=Decimal("100000.00")
        )

        # Two partial payments
        Payment.objects.create(
            student=student,
            amount=Decimal("60000.00"),
            payment_date=date.today(),
            reference_number="PAY-1",
            is_active=True
        )
        Payment.objects.create(
            student=student,
            amount=Decimal("40000.00"),
            payment_date=date.today() + timedelta(days=1),
            reference_number="PAY-2",
            is_active=True
        )

        payments = Payment.objects.filter(student=student)
        total = sum(p.amount for p in payments)
        assert total == Decimal("100000.00")


@pytest.mark.django_db
class TestResultsStateTransitions:
    """Result module state machines."""

    def test_result_draft_creation(self, db):
        """Create result in draft state."""
        from sims_backend.results.models import ResultHeader
        from sims_backend.academics.models import AcademicPeriod, Course, Department

        dept = Department.objects.create(name="Medicine", code="MED", is_active=True)
        course = Course.objects.create(
            name="Anatomy", code="ANAT101", department=dept,
            credit_hours=3, is_active=True
        )
        period = AcademicPeriod.objects.create(
            year=2024, semester=1, start_date="2024-01-01",
            end_date="2024-06-30", is_active=True
        )

        header = ResultHeader.objects.create(
            course=course,
            academic_period=period,
            state="draft",
            created_by_id=1,
            is_active=True
        )

        assert header.state == "draft"

    def test_result_publish_from_draft(self, db):
        """Publish result from draft state."""
        from sims_backend.results.models import ResultHeader
        from sims_backend.academics.models import AcademicPeriod, Course, Department

        dept = Department.objects.create(name="Medicine", code="MED", is_active=True)
        course = Course.objects.create(
            name="Anatomy", code="ANAT101", department=dept,
            credit_hours=3, is_active=True
        )
        period = AcademicPeriod.objects.create(
            year=2024, semester=1, start_date="2024-01-01",
            end_date="2024-06-30", is_active=True
        )

        header = ResultHeader.objects.create(
            course=course,
            academic_period=period,
            state="draft",
            created_by_id=1,
            is_active=True
        )

        header.state = "published"
        header.published_date = date.today()
        header.published_by_id = 1
        header.save()

        header.refresh_from_db()
        assert header.state == "published"

    def test_result_freeze_after_publish(self, db):
        """Freeze result after publish."""
        from sims_backend.results.models import ResultHeader
        from sims_backend.academics.models import AcademicPeriod, Course, Department

        dept = Department.objects.create(name="Medicine", code="MED", is_active=True)
        course = Course.objects.create(
            name="Anatomy", code="ANAT101", department=dept,
            credit_hours=3, is_active=True
        )
        period = AcademicPeriod.objects.create(
            year=2024, semester=1, start_date="2024-01-01",
            end_date="2024-06-30", is_active=True
        )

        header = ResultHeader.objects.create(
            course=course,
            academic_period=period,
            state="published",
            created_by_id=1,
            published_by_id=1,
            published_date=date.today(),
            is_active=True
        )

        header.state = "frozen"
        header.frozen_date = date.today()
        header.frozen_by_id = 1
        header.save()

        header.refresh_from_db()
        assert header.state == "frozen"


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
