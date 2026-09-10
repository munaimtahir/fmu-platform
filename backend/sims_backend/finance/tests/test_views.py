"""
Tests for finance ledger and payment endpoints.

Rewritten against the current `LedgerEntry`/`Payment` models (see
sims_backend/finance/models.py) -- the legacy `Challan`/`Charge`/
`StudentLedgerItem` models this file previously tested no longer exist. See
`test_challan_permissions.py`'s module docstring for the full migration
context and RBAC fixture pattern reused here.

`LedgerEntryViewSet` is read-only (`ReadOnlyModelViewSet`) and uses a
dedicated `LedgerEntryPermission` that lets any STUDENT-group user
list/retrieve; `get_queryset()` then scopes results to the caller's own
records unless they hold the `finance.ledger_entries.view` task, and a
STUDENT-role user with no linked `Student` returns an empty (200, count 0)
list rather than a 403 -- both behaviors are preserved here.

`PaymentViewSet`, like `VoucherViewSet`, is gated purely by
`PermissionTaskRequired` with no student self-service carve-out, so a plain
student is rejected outright rather than being scoped to "own payments".
"""

from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import AcademicPeriod, Batch, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.finance.models import FeePlan, FeeType, LedgerEntry, Payment
from sims_backend.finance.services import create_voucher_from_feeplan, post_payment
from sims_backend.students.models import Student


@pytest.fixture
def setup_data(db):
    program = Program.objects.create(name="BS CS", is_active=True)
    batch = Batch.objects.create(name="2023", program=program, start_year=2023)
    acad_group = StudentGroup.objects.create(name="A", batch=batch)
    term = AcademicPeriod.objects.create(
        period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
        name="Fall 2023",
        start_date=date(2023, 9, 1),
        end_date=date(2099, 1, 31),
    )
    fee_type = FeeType.objects.create(code="TUITION", name="Tuition Fee")
    FeePlan.objects.create(
        program=program,
        term=term,
        fee_type=fee_type,
        amount=Decimal("50000.00"),
        is_mandatory=True,
        frequency=FeePlan.FREQ_PER_TERM,
    )

    for name in ["ADMIN", "STUDENT", "FINANCE"]:
        Group.objects.get_or_create(name=name)

    user1 = User.objects.create_user(username="student1", password="password")
    user1.groups.add(Group.objects.get(name="STUDENT"))
    student1 = Student.objects.create(
        user=user1, reg_no="REG-001", name="Student One", program=program, batch=batch, group=acad_group
    )

    user2 = User.objects.create_user(username="student2", password="password")
    user2.groups.add(Group.objects.get(name="STUDENT"))
    student2 = Student.objects.create(
        user=user2, reg_no="REG-002", name="Student Two", program=program, batch=batch, group=acad_group
    )

    user_admin = User.objects.create_user(username="admin", password="password")
    user_admin.groups.add(Group.objects.get(name="ADMIN"))

    user_finance = User.objects.create_user(username="finance", password="password")
    user_finance.groups.add(Group.objects.get(name="FINANCE"))

    # Voucher generation seeds a debit LedgerEntry per voucher automatically.
    voucher1 = create_voucher_from_feeplan(
        student=student1, term=term, created_by=user_finance, due_date=date.today()
    ).voucher
    voucher2 = create_voucher_from_feeplan(
        student=student2, term=term, created_by=user_finance, due_date=date.today()
    ).voucher

    ledger1 = LedgerEntry.objects.filter(voucher=voucher1).first()
    ledger2 = LedgerEntry.objects.filter(voucher=voucher2).first()

    payment1 = post_payment(
        student=student1,
        term=term,
        amount=voucher1.total_amount,
        method=Payment.METHOD_CASH,
        voucher=voucher1,
        received_by=user_finance,
    )
    payment2 = post_payment(
        student=student2,
        term=term,
        amount=voucher2.total_amount,
        method=Payment.METHOD_CASH,
        voucher=voucher2,
        received_by=user_finance,
    )

    return {
        "user1": user1,
        "student1": student1,
        "user2": user2,
        "student2": student2,
        "user_admin": user_admin,
        "user_finance": user_finance,
        "ledger1": ledger1,
        "ledger2": ledger2,
        "payment1": payment1,
        "payment2": payment2,
    }


@pytest.mark.django_db
class TestLedgerEntryAccess:
    def test_student_sees_own_ledger_entries(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        ids = [row["id"] for row in results]
        assert setup_data["ledger1"].id in ids
        assert setup_data["ledger2"].id not in ids

    def test_student_cannot_see_others_ledger_entry(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get(f"/api/finance/ledger/{setup_data['ledger2'].id}/")
        # Should return 404 because it's filtered out of the queryset.
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_sees_all_ledger_entries(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_admin"])

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        ids = [row["id"] for row in results]
        assert setup_data["ledger1"].id in ids
        assert setup_data["ledger2"].id in ids

    def test_finance_sees_all_ledger_entries(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_finance"])

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] >= 2

    def test_student_without_link_sees_empty_list(self, setup_data):
        """A STUDENT-role user with no linked Student record gets an empty
        200 list, not a 403 -- see LedgerEntryViewSet.get_queryset()."""
        unlinked_user = User.objects.create_user(username="unlinked", password="password")
        unlinked_user.groups.add(Group.objects.get(name="STUDENT"))

        client = APIClient()
        client.force_authenticate(user=unlinked_user)

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] == 0


@pytest.mark.django_db
class TestPaymentAccess:
    """PaymentViewSet is task-gated like VoucherViewSet -- students without
    a finance task cannot list/retrieve payments, even their own."""

    def test_finance_sees_all_payments(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_finance"])

        response = client.get("/api/finance/payments/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        ids = [row["id"] for row in results]
        assert setup_data["payment1"].id in ids
        assert setup_data["payment2"].id in ids

    def test_admin_sees_all_payments(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_admin"])

        response = client.get("/api/finance/payments/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] >= 2

    def test_plain_student_cannot_list_payments(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get("/api/finance/payments/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_plain_student_cannot_retrieve_own_payment(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get(f"/api/finance/payments/{setup_data['payment1'].id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
