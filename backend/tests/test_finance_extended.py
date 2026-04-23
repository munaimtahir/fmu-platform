import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient
from sims_backend.academics.models import AcademicPeriod, Batch, Program, Group as AcadGroup
from sims_backend.finance.models import FeePlan, FeeType, Voucher, Payment, LedgerEntry

@pytest.fixture
def finance_api_setup(db):
    program = Program.objects.create(name="Finance Ext Program")
    term = AcademicPeriod.objects.create(period_type=AcademicPeriod.PERIOD_TYPE_YEAR, name="ExtTerm1")
    fee_type = FeeType.objects.create(code="EXT_TUITION", name="Ext Tuition Fee")
    
    admin_user = User.objects.create_superuser(username="admin_fin", password="pass", email="admin@sims.edu")
    
    # Create Finance role and user
    from django.contrib.auth.models import Group as AuthGroup
    finance_group, _ = AuthGroup.objects.get_or_create(name="FINANCE")
    finance_user = User.objects.create_user(username="fin_user", password="pass")
    finance_user.groups.add(finance_group)
    
    # Give finance user permissions via task codes if needed, but for ViewSet we use PermissionTaskRequired
    # In tests, sometimes easier to just use admin or mock permissions.
    # But let's try to do it properly.
    from core.models import Role, PermissionTask, RoleTaskAssignment
    role, _ = Role.objects.get_or_create(name="FINANCE")
    tasks = [
        "finance.vouchers.view", "finance.vouchers.create", "finance.vouchers.generate",
        "finance.payments.view", "finance.payments.create", "finance.payments.verify",
        "finance.reports.view"
    ]
    for code in tasks:
        task, _ = PermissionTask.objects.get_or_create(code=code)
        RoleTaskAssignment.objects.get_or_create(role=role, task=task)

    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="Group A")
    from sims_backend.students.models import Student
    student = Student.objects.create(
        reg_no="EXT-001", name="Ext Student", program=program,
        batch=batch, group=group,
        status=Student.STATUS_ACTIVE
    )
    
    return {
        "program": program,
        "term": term,
        "fee_type": fee_type,
        "admin_user": admin_user,
        "finance_user": finance_user,
        "student": student,
    }

@pytest.mark.django_db
class TestFinanceReporting:
    def test_defaulters_report_json(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        
        # Create a voucher with dues
        from sims_backend.finance.services import create_voucher_from_feeplan
        FeePlan.objects.create(
            program=finance_api_setup["program"],
            term=finance_api_setup["term"],
            fee_type=finance_api_setup["fee_type"],
            amount=Decimal("5000.00"),
            is_mandatory=True
        )
        due_date = date.today() + timedelta(days=30)
        create_voucher_from_feeplan(finance_api_setup["student"], finance_api_setup["term"], finance_api_setup["admin_user"], due_date=due_date)
        
        from django.urls import reverse
        url = reverse("finance-reports-defaulters")
        data = {"term_id": finance_api_setup["term"].id, "min_outstanding": 100}
        response = client.post(url, data, format="json")
        assert response.status_code == 200
        assert len(response.data["rows"]) == 1
        assert response.data["rows"][0]["reg_no"] == "EXT-001"

    def test_collection_report(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        
        # Post and verify a payment
        from sims_backend.finance.services import post_payment, verify_payment
        payment = post_payment(
            finance_api_setup["student"], finance_api_setup["term"], 
            Decimal("1000.00"), Payment.METHOD_CASH, received_by=finance_api_setup["admin_user"]
        )
        verify_payment(payment, approved_by=finance_api_setup["admin_user"])
        
        today = date.today().isoformat()
        url = f"/api/finance/reports/collection/?start={today}&end={today}"
        response = client.get(url)
        assert response.status_code == 200
        assert response.data["total_collected"] == 1000.0
        assert response.data["total_count"] == 1

    def test_aging_report(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        url = "/api/finance/reports/aging/"
        response = client.get(url)
        assert response.status_code == 200
        assert "buckets" in response.data

@pytest.mark.django_db
class TestFinanceActions:
    def test_voucher_generate_bulk(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["finance_user"])
        
        FeePlan.objects.create(
            program=finance_api_setup["program"],
            term=finance_api_setup["term"],
            fee_type=finance_api_setup["fee_type"],
            amount=Decimal("5000.00"),
            is_mandatory=True
        )
        
        url = "/api/finance/vouchers/generate/"
        data = {
            "term_id": finance_api_setup["term"].id,
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "program_id": finance_api_setup["program"].id
        }
        response = client.post(url, data)
        assert response.status_code == 201
        assert len(response.data["created"]) == 1

    def test_payment_reverse(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        
        from sims_backend.finance.services import post_payment, verify_payment
        payment = post_payment(
            finance_api_setup["student"], finance_api_setup["term"], 
            Decimal("1000.00"), Payment.METHOD_CASH, received_by=finance_api_setup["admin_user"]
        )
        verify_payment(payment, approved_by=finance_api_setup["admin_user"])
        
        url = f"/api/finance/payments/{payment.id}/reverse/"
        response = client.post(url, {"reason": "Duplicate entry"})
        assert response.status_code == 200
        assert "REVERSED" in response.data["notes"]
        
        # Check ledger entries for reversal (original credit should have a corresponding debit)
        # Reversal service usually creates a balancing entry
        assert LedgerEntry.objects.filter(student=finance_api_setup["student"], entry_type=LedgerEntry.ENTRY_DEBIT).exists()

    def test_payment_verify_reject(self, finance_api_setup):
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        
        from sims_backend.finance.services import post_payment
        payment = post_payment(
            finance_api_setup["student"], finance_api_setup["term"], 
            Decimal("1000.00"), Payment.METHOD_BANK_TRANSFER, received_by=finance_api_setup["admin_user"]
        )
        
        url = f"/api/finance/payments/{payment.id}/verify/"
        response = client.post(url, {"approve": False, "notes": "Invalid receipt"}, format="json")
        assert response.status_code == 200
        assert response.data["status"] == Payment.STATUS_REJECTED

    def test_adjustment_approval_flow(self, finance_api_setup):
        from sims_backend.finance.models import Adjustment
        from sims_backend.finance.services import approve_adjustment
        
        adjustment = Adjustment.objects.create(
            student=finance_api_setup["student"],
            term=finance_api_setup["term"],
            kind=Adjustment.KIND_WAIVER,
            amount=Decimal("500.00"),
            reason="Scholarship",
            requested_by=finance_api_setup["admin_user"]
        )
        
        approved = approve_adjustment(adjustment, finance_api_setup["admin_user"])
        assert approved.status == Adjustment.STATUS_APPROVED
        assert LedgerEntry.objects.filter(student=finance_api_setup["student"], entry_type=LedgerEntry.ENTRY_CREDIT).exists()

    def test_voucher_reconciliation(self, finance_api_setup):
        from sims_backend.finance.services import create_voucher_from_feeplan, post_payment, reconcile_voucher_status
        from sims_backend.finance.models import FeePlan
        FeePlan.objects.create(
            program=finance_api_setup["program"],
            term=finance_api_setup["term"],
            fee_type=finance_api_setup["fee_type"],
            amount=Decimal("1000.00"),
            is_mandatory=True
        )
        due_date = date.today() + timedelta(days=30)
        voucher_res = create_voucher_from_feeplan(
            finance_api_setup["student"], finance_api_setup["term"], finance_api_setup["admin_user"],
            due_date=due_date
        )
        voucher = voucher_res.voucher
        
        # Partially pay
        from sims_backend.finance.services import verify_payment
        payment = post_payment(
            finance_api_setup["student"], finance_api_setup["term"], 
            Decimal("400.00"), Payment.METHOD_CASH, received_by=finance_api_setup["admin_user"],
            voucher=voucher
        )
        verify_payment(payment, approved_by=finance_api_setup["admin_user"])
        
        reconciled = reconcile_voucher_status(voucher)
        assert reconciled.status == Voucher.STATUS_PARTIAL

    def test_voucher_pdf_view(self, finance_api_setup):
        from sims_backend.finance.services import create_voucher_from_feeplan
        from sims_backend.finance.models import FeePlan
        client = APIClient()
        client.force_authenticate(user=finance_api_setup["admin_user"])
        
        FeePlan.objects.create(
            program=finance_api_setup["program"],
            term=finance_api_setup["term"],
            fee_type=finance_api_setup["fee_type"],
            amount=Decimal("1000.00"),
            is_mandatory=True
        )
        due_date = date.today() + timedelta(days=30)
        voucher_res = create_voucher_from_feeplan(
            finance_api_setup["student"], finance_api_setup["term"], finance_api_setup["admin_user"],
            due_date=due_date
        )
        voucher = voucher_res.voucher
        
        url = f"/api/finance/vouchers/{voucher.id}/pdf/"
        response = client.get(url)
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
