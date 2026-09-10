"""
Tests for finance API permissions (Voucher endpoint).

This file used to test a `Challan` model that no longer exists. The finance
domain was refactored to `Voucher`/`VoucherItem`/`LedgerEntry`/`Payment`/
`Adjustment` (see sims_backend/finance/models.py), with endpoints moved from
`/api/finance/challans/` to `/api/finance/vouchers/`,
`/api/finance/payments/`, `/api/finance/ledger/` (sims_backend/finance/urls.py).

Permissions are task-based RBAC (`PermissionTaskRequired`, see
core/permissions.py) backed by `PermissionTask`/`Role`/`UserTaskAssignment`.
When no task rows are seeded, `has_permission_task` falls back to a
conservative Django-Group mapping (`_has_builtin_role_task`): an "ADMIN"
group grants everything, a "FINANCE" group grants all `finance.*` tasks.
This is the same lightweight fixture pattern already used by
`sims_backend/attendance/tests/test_permissions.py` and
`tests/test_finance_module.py`'s `finance_setup` fixture, so it's reused
here rather than inventing a new RBAC setup helper.

Unlike the old ChallanViewSet, `VoucherViewSet` (like `PaymentViewSet`) is
gated purely by `PermissionTaskRequired` with no student self-service
carve-out: a plain STUDENT-group user without a finance task is rejected at
the permission-check stage, before `get_queryset()`'s "own records" scoping
is ever reached. Only `LedgerEntryViewSet` grants students read access to
their own records via a dedicated `LedgerEntryPermission` -- that scoping
(including the "unlinked student gets an empty list, not 403" behavior) is
covered in test_views.py.
"""

from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import AcademicPeriod, Batch, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.finance.models import FeePlan, FeeType
from sims_backend.finance.services import create_voucher_from_feeplan
from sims_backend.students.models import Student


@pytest.fixture
def voucher_setup(db):
    program = Program.objects.create(name="CS", description="Computer Science")
    batch = Batch.objects.create(name="2024", program=program, start_year=2024)
    student_group = StudentGroup.objects.create(name="A", batch=batch)
    term = AcademicPeriod.objects.create(period_type=AcademicPeriod.PERIOD_TYPE_YEAR, name="Term 1")
    fee_type = FeeType.objects.create(code="TUITION", name="Tuition Fee")
    FeePlan.objects.create(
        program=program,
        term=term,
        fee_type=fee_type,
        amount=Decimal("1000.00"),
        is_mandatory=True,
        frequency=FeePlan.FREQ_PER_TERM,
    )

    student_role, _ = Group.objects.get_or_create(name="STUDENT")
    admin_role, _ = Group.objects.get_or_create(name="ADMIN")
    finance_role, _ = Group.objects.get_or_create(name="FINANCE")

    student1_user = User.objects.create_user(username="student1", password="password")
    student1_user.groups.add(student_role)
    student1 = Student.objects.create(
        user=student1_user,
        reg_no="REG001",
        name="Student One",
        program=program,
        batch=batch,
        group=student_group,
    )

    student2_user = User.objects.create_user(username="student2", password="password")
    student2_user.groups.add(student_role)
    student2 = Student.objects.create(
        user=student2_user,
        reg_no="REG002",
        name="Student Two",
        program=program,
        batch=batch,
        group=student_group,
    )

    admin_user = User.objects.create_user(username="admin", password="password")
    admin_user.groups.add(admin_role)

    finance_user = User.objects.create_user(username="finance", password="password")
    finance_user.groups.add(finance_role)

    voucher1 = create_voucher_from_feeplan(
        student=student1, term=term, created_by=finance_user, due_date=date.today()
    ).voucher
    voucher2 = create_voucher_from_feeplan(
        student=student2, term=term, created_by=finance_user, due_date=date.today()
    ).voucher

    return {
        "student1_user": student1_user,
        "student1": student1,
        "student2_user": student2_user,
        "student2": student2,
        "admin_user": admin_user,
        "finance_user": finance_user,
        "voucher1": voucher1,
        "voucher2": voucher2,
    }


@pytest.mark.django_db
class TestVoucherAccess:
    """Voucher list/detail access is gated by the finance.vouchers.view task."""

    def test_finance_can_see_all_vouchers(self, voucher_setup):
        client = APIClient()
        client.force_authenticate(user=voucher_setup["finance_user"])
        response = client.get("/api/finance/vouchers/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        ids = [row["id"] for row in data["results"]]
        assert voucher_setup["voucher1"].id in ids
        assert voucher_setup["voucher2"].id in ids

    def test_admin_can_see_all_vouchers(self, voucher_setup):
        client = APIClient()
        client.force_authenticate(user=voucher_setup["admin_user"])
        response = client.get("/api/finance/vouchers/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] >= 2

    def test_finance_can_retrieve_any_voucher(self, voucher_setup):
        client = APIClient()
        client.force_authenticate(user=voucher_setup["finance_user"])
        response = client.get(f"/api/finance/vouchers/{voucher_setup['voucher2'].id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == voucher_setup["voucher2"].id

    def test_plain_student_cannot_list_vouchers(self, voucher_setup):
        """A STUDENT-role user with no finance task is rejected outright --
        VoucherViewSet has no student self-service carve-out (unlike
        LedgerEntryViewSet)."""
        client = APIClient()
        client.force_authenticate(user=voucher_setup["student1_user"])
        response = client.get("/api/finance/vouchers/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_plain_student_cannot_retrieve_own_voucher(self, voucher_setup):
        client = APIClient()
        client.force_authenticate(user=voucher_setup["student1_user"])
        response = client.get(f"/api/finance/vouchers/{voucher_setup['voucher1'].id}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
