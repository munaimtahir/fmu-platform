from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.apps import apps as django_apps
from django.contrib.auth.models import Group, User

from core.models import PermissionTask, UserTaskAssignment
from core.rbac_catalog import TASK_CODES, seed_rbac_catalog
from sims_backend.academics.models import AcademicPeriod, Batch, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.finance.models import FeePlan, FeeType, LedgerEntry, Voucher
from sims_backend.finance.services import (
    create_voucher_from_feeplan,
    post_payment,
    reverse_payment,
    verify_payment,
)
from sims_backend.students.models import Student

ME = "/api/core/users/me/"


def make_user(name, groups=()):
    user = User.objects.create_user(username=name, password="x")
    for group_name in groups:
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)
    return user


@pytest.mark.django_db
class TestUsersMeEffectiveAccess:
    def test_payload_shape_is_preserved(self, api_client):
        user = make_user("me_shape", ["Student"])
        api_client.force_authenticate(user=user)
        data = api_client.get(ME).json()
        assert set(data) == {"id", "username", "email", "first_name", "last_name", "is_active", "roles", "tasks", "profile"}
        assert data["username"] == "me_shape"
        for task in data["tasks"]:
            assert set(task) == {"id", "code", "name", "module"}
        for role in data["roles"]:
            assert set(role) == {"id", "name", "description"}

    def test_group_only_user_gets_effective_roles_and_tasks_before_seeding(self, api_client):
        api_client.force_authenticate(user=make_user("me_faculty", ["Faculty"]))
        data = api_client.get(ME).json()
        assert [r["name"] for r in data["roles"]] == ["FACULTY"]
        codes = {t["code"] for t in data["tasks"]}
        assert {"timetable.entries.view", "learning.materials.create", "results.result_components.update"} <= codes
        assert "finance.vouchers.cancel" not in codes
        assert all(t["id"] is None for t in data["tasks"])

    def test_seeded_tasks_carry_ids_and_include_direct_assignments(self, api_client):
        seed_rbac_catalog(django_apps)
        examcell = make_user("me_examcell", ["EXAMCELL"])
        UserTaskAssignment.objects.create(
            user=examcell, task=PermissionTask.objects.get(code="transcripts.transcripts.generate")
        )
        api_client.force_authenticate(user=examcell)
        data = api_client.get(ME).json()
        by_code = {t["code"]: t for t in data["tasks"]}
        assert by_code["transcripts.transcripts.generate"]["id"] is not None
        assert "exams.exams.publish" in by_code
        assert "transcripts.transcripts.email" not in by_code

    def test_superuser_gets_every_task_and_admin_role(self, api_client):
        seed_rbac_catalog(django_apps)
        api_client.force_authenticate(user=User.objects.create_superuser(username="me_root", password="x"))
        data = api_client.get(ME).json()
        assert {t["code"] for t in data["tasks"]} >= set(TASK_CODES)
        assert [r["name"] for r in data["roles"]] == ["ADMIN"]

    def test_requires_authentication(self, api_client):
        assert api_client.get(ME).status_code in (401, 403)


@pytest.fixture
def finance_world(db):
    program = Program.objects.create(name="Fin Program")
    batch = Batch.objects.create(program=program, name="B1", start_year=2024)
    group = StudentGroup.objects.create(batch=batch, name="G1")
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
    student_user = make_user("stu_fin", ["STUDENT"])
    student = make_student(
        user=student_user,
        reg_no="F-1",
        name="Fin Student",
        program=program,
        batch=batch,
        group=group,
        status=Student.STATUS_ACTIVE,
        email="f1@sims.edu",
    )
    finance = make_user("fin_officer", ["FINANCE"])
    voucher = create_voucher_from_feeplan(student, term, finance, date.today() + timedelta(days=30)).voucher
    return {"student": student, "student_user": student_user, "finance": finance, "voucher": voucher, "term": term}


def cancel_url(voucher):
    return f"/api/finance/vouchers/{voucher.id}/cancel/"


@pytest.mark.django_db
class TestVoucherCancel:
    def test_finance_can_cancel_and_ledger_is_reversed(self, api_client, finance_world):
        voucher = finance_world["voucher"]
        debits = LedgerEntry.objects.filter(voucher=voucher, entry_type=LedgerEntry.ENTRY_DEBIT)
        assert debits.exists()

        api_client.force_authenticate(user=finance_world["finance"])
        resp = api_client.post(cancel_url(voucher), {"reason": "Issued in error"}, format="json")

        assert resp.status_code == 200, resp.content
        assert resp.json()["status"] == Voucher.STATUS_CANCELLED
        voucher.refresh_from_db()
        assert voucher.status == Voucher.STATUS_CANCELLED
        assert "Issued in error" in voucher.notes
        credits = LedgerEntry.objects.filter(
            voucher=voucher, entry_type=LedgerEntry.ENTRY_CREDIT, reference_type=LedgerEntry.REF_REVERSAL
        )
        assert sum(c.amount for c in credits) == sum(d.amount for d in debits)

    @pytest.mark.parametrize("payload", [{}, {"reason": ""}, {"reason": "   "}])
    def test_reason_is_required(self, api_client, finance_world, payload):
        api_client.force_authenticate(user=finance_world["finance"])
        resp = api_client.post(cancel_url(finance_world["voucher"]), payload, format="json")
        assert resp.status_code == 400
        finance_world["voucher"].refresh_from_db()
        assert finance_world["voucher"].status != Voucher.STATUS_CANCELLED

    def test_already_cancelled_is_rejected_without_new_ledger_entries(self, api_client, finance_world):
        api_client.force_authenticate(user=finance_world["finance"])
        assert api_client.post(cancel_url(finance_world["voucher"]), {"reason": "first"}, format="json").status_code == 200
        entries = LedgerEntry.objects.count()
        again = api_client.post(cancel_url(finance_world["voucher"]), {"reason": "second"}, format="json")
        assert again.status_code == 400
        assert again.json()["error"]["code"] == "ALREADY_CANCELLED"
        assert LedgerEntry.objects.count() == entries

    @pytest.mark.parametrize("group", ["STUDENT", "FACULTY", "EXAMCELL", "COORDINATOR", "REGISTRAR"])
    def test_other_roles_are_denied(self, api_client, finance_world, group):
        api_client.force_authenticate(user=make_user(f"deny_{group.lower()}", [group]))
        resp = api_client.post(cancel_url(finance_world["voucher"]), {"reason": "x"}, format="json")
        assert resp.status_code in (403, 404)
        finance_world["voucher"].refresh_from_db()
        assert finance_world["voucher"].status != Voucher.STATUS_CANCELLED

    def test_verified_payment_blocks_cancel_until_reversed(self, api_client, finance_world):
        voucher, finance = finance_world["voucher"], finance_world["finance"]
        payment = post_payment(
            finance_world["student"], finance_world["term"], Decimal("1000.00"), "cash", finance, voucher=voucher
        )
        verify_payment(payment, approved_by=finance)

        api_client.force_authenticate(user=finance)
        blocked = api_client.post(cancel_url(voucher), {"reason": "oops"}, format="json")
        assert blocked.status_code == 400
        assert blocked.json()["error"]["code"] == "PAYMENTS_EXIST"

        reverse_payment(payment, finance, "bounced")
        voucher.refresh_from_db()
        ok = api_client.post(cancel_url(voucher), {"reason": "oops"}, format="json")
        assert ok.status_code == 200, ok.content

    def test_admin_finance_pilot_account_can_cancel(self, api_client, finance_world):
        api_client.force_authenticate(user=make_user("admin_fin", ["ADMIN", "FINANCE"]))
        resp = api_client.post(cancel_url(finance_world["voucher"]), {"reason": "x"}, format="json")
        assert resp.status_code == 200


@pytest.mark.django_db
class TestDashboardStatsByRole:
    STATS = "/api/dashboard/stats/"

    def stats(self, api_client, name, groups):
        api_client.force_authenticate(user=make_user(name, groups))
        resp = api_client.get(self.STATS)
        assert resp.status_code == 200
        return resp.json()

    def test_registrar_gets_registry_counts(self, api_client):
        data = self.stats(api_client, "dash_reg", ["REGISTRAR"])
        assert set(data) == {
            "active_students",
            "students_on_leave",
            "total_programs",
            "total_batches",
            "pending_compliance_reviews",
            "pending_result_corrections",
        }
        assert all(isinstance(v, int) for v in data.values())

    def test_examcell_gets_exam_and_result_counts(self, api_client):
        data = self.stats(api_client, "dash_exc", ["EXAMCELL"])
        assert set(data) == {
            "total_exams",
            "unpublished_exams",
            "draft_results",
            "verified_results",
            "published_results",
            "frozen_results",
            "pending_result_corrections",
        }

    def test_registrar_counts_reflect_data(self, api_client):
        program = Program.objects.create(name="Dash Program", is_active=True)
        batch = Batch.objects.create(program=program, name="DB", start_year=2024)
        group = StudentGroup.objects.create(batch=batch, name="DG")
        for i, status in enumerate([Student.STATUS_ACTIVE, Student.STATUS_ACTIVE, Student.STATUS_ON_LEAVE]):
            make_student(
                user=make_user(f"dash_s{i}", ["STUDENT"]),
                reg_no=f"D-{i}",
                name=f"S{i}",
                program=program,
                batch=batch,
                group=group,
                status=status,
                email=f"d{i}@e.edu",
            )
        data = self.stats(api_client, "dash_reg2", ["REGISTRAR"])
        assert data["active_students"] == 2
        assert data["students_on_leave"] == 1
        assert data["total_programs"] == 1

    def test_coordinator_and_office_assistant_have_backend_stats(self, api_client):
        coordinator = self.stats(api_client, "dash_coord", ["COORDINATOR"])
        assert "total_students" in coordinator and "total_sessions" in coordinator
        assistant = self.stats(api_client, "dash_oa", ["OFFICE_ASSISTANT"])
        assert set(assistant) == {"total_sessions", "draft_results", "total_exams"}

from sims_backend.students.test_factories import make_student
