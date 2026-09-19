import pytest
from django.contrib.auth.models import Group, User

from sims_backend.academics.models import Batch, Program
from sims_backend.academics.models import Group as AcadGroup
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance
from sims_backend.students.models import Student

ADMIN_BASE = "/api/compliance/admin-compliance/"
DEFINITIONS = "/api/compliance/definitions/"
MY = "/api/compliance/my-compliance/"


def _user_in_group(username, group_name):
    user = User.objects.create_user(username=username, password="pass")
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)
    return user


@pytest.fixture
def world(db):
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")

    def make_student(username, reg_no):
        user = _user_in_group(username, "STUDENT")
        student = Student.objects.create(
            user=user, reg_no=reg_no, name=username, program=program, batch=batch, group=group
        )
        return user, student

    owner_user, owner = make_student("stu_owner", "OWN1")
    other_user, other = make_student("stu_other", "OTH1")

    definition = RequirementDefinition.objects.create(title="B-Form", requirement_type="document")
    instance = RequirementInstance.objects.create(
        student=owner, definition=definition, status=RequirementInstance.STATUS_SUBMITTED
    )
    return {
        "owner_user": owner_user,
        "owner": owner,
        "other_user": other_user,
        "other": other,
        "definition": definition,
        "instance": instance,
    }


@pytest.mark.django_db
class TestAdminComplianceAuthorization:
    @pytest.mark.parametrize("group", ["STUDENT", "FACULTY", "EXAMCELL", "COORDINATOR"])
    def test_non_admin_roles_denied_everywhere(self, api_client, world, group):
        user = _user_in_group(f"u_{group.lower()}", group)
        api_client.force_authenticate(user=user)
        iid = world["instance"].id
        did = world["definition"].id

        assert api_client.get(ADMIN_BASE).status_code == 403
        assert api_client.get(f"{ADMIN_BASE}review_queue/").status_code == 403
        assert api_client.post(f"{ADMIN_BASE}{iid}/verify/", {"notes": "x"}, format="json").status_code == 403
        assert api_client.post(f"{ADMIN_BASE}{iid}/reject/", {"notes": "x"}, format="json").status_code == 403
        assert (
            api_client.post(
                f"{ADMIN_BASE}assign_to_student/",
                {"student_id": world["owner"].id, "definition_id": did},
                format="json",
            ).status_code
            == 403
        )
        assert api_client.delete(f"{ADMIN_BASE}{iid}/").status_code == 403
        assert api_client.get(DEFINITIONS).status_code == 403
        assert api_client.post(DEFINITIONS, {"title": "T", "requirement_type": "document"}, format="json").status_code == 403
        assert api_client.delete(f"{DEFINITIONS}{did}/").status_code == 403

        instance = RequirementInstance.objects.get(id=iid)
        assert instance.status == RequirementInstance.STATUS_SUBMITTED
        assert RequirementDefinition.objects.filter(id=did).exists()

    def test_registrar_can_review_and_assign(self, api_client, world):
        registrar = _user_in_group("registrar_c", "REGISTRAR")
        api_client.force_authenticate(user=registrar)
        iid = world["instance"].id

        assert api_client.get(f"{ADMIN_BASE}review_queue/").status_code == 200
        assert api_client.post(f"{ADMIN_BASE}{iid}/verify/", {"notes": "ok"}, format="json").status_code == 200
        assert RequirementInstance.objects.get(id=iid).status == RequirementInstance.STATUS_VERIFIED

        resp = api_client.post(
            f"{ADMIN_BASE}assign_to_student/",
            {"student_id": world["other"].id, "definition_id": world["definition"].id},
            format="json",
        )
        assert resp.status_code == 201

        created = api_client.post(DEFINITIONS, {"title": "Vaccine", "requirement_type": "document"}, format="json")
        assert created.status_code == 201

    def test_admin_can_reject_and_list_definitions(self, api_client, world):
        admin = _user_in_group("admin_c", "ADMIN")
        api_client.force_authenticate(user=admin)
        iid = world["instance"].id

        assert api_client.get(DEFINITIONS).status_code == 200
        assert api_client.post(f"{ADMIN_BASE}{iid}/reject/", {"notes": "blurry"}, format="json").status_code == 200
        assert RequirementInstance.objects.get(id=iid).status == RequirementInstance.STATUS_REJECTED

    def test_unauthenticated_denied(self, api_client, world):
        assert api_client.get(ADMIN_BASE).status_code in (401, 403)
        assert api_client.get(DEFINITIONS).status_code in (401, 403)


@pytest.mark.django_db
class TestStudentOwnershipIsolation:
    def test_student_sees_only_own_requirements(self, api_client, world):
        api_client.force_authenticate(user=world["other_user"])
        resp = api_client.get(MY)
        assert resp.status_code == 200
        rows = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        assert rows == []

    def test_student_cannot_access_another_students_instance(self, api_client, world):
        api_client.force_authenticate(user=world["other_user"])
        iid = world["instance"].id
        assert api_client.get(f"{MY}{iid}/").status_code == 404
        assert api_client.post(f"{MY}{iid}/submit/", {"value": "hijack"}, format="json").status_code == 404

    def test_owner_can_still_submit(self, api_client, world):
        instance = world["instance"]
        instance.status = RequirementInstance.STATUS_PENDING
        instance.save()
        api_client.force_authenticate(user=world["owner_user"])
        resp = api_client.post(f"{MY}{instance.id}/submit/", {"value": "mine"}, format="json")
        assert resp.status_code == 200


@pytest.mark.django_db
class TestTranscriptEnqueueAuthorization:
    @pytest.fixture(autouse=True)
    def fake_queue(self, monkeypatch):
        class _Job:
            id = "job-1"

        class _Queue:
            def enqueue(self, *args, **kwargs):
                return _Job()

        monkeypatch.setattr("sims_backend.transcripts.views.django_rq.get_queue", lambda name: _Queue())
        monkeypatch.setattr(
            "sims_backend.transcripts.views.finance_gate_checks",
            lambda student, _term: {"gating": {"can_view_transcript": True}},
        )

    @pytest.mark.parametrize("group", ["FACULTY", "EXAMCELL", "COORDINATOR"])
    def test_unrelated_staff_cannot_enqueue(self, api_client, world, group):
        api_client.force_authenticate(user=_user_in_group(f"t_{group.lower()}", group))
        resp = api_client.post("/api/transcripts/enqueue/", {"student_id": world["owner"].id}, format="json")
        assert resp.status_code == 403

    @pytest.mark.parametrize("group", ["ADMIN", "REGISTRAR", "FINANCE"])
    def test_admin_registrar_finance_can_enqueue(self, api_client, world, group):
        api_client.force_authenticate(user=_user_in_group(f"t_{group.lower()}", group))
        resp = api_client.post("/api/transcripts/enqueue/", {"student_id": world["owner"].id}, format="json")
        assert resp.status_code == 202

    def test_student_own_and_other(self, api_client, world):
        api_client.force_authenticate(user=world["owner_user"])
        own = api_client.post("/api/transcripts/enqueue/", {"student_id": world["owner"].id}, format="json")
        assert own.status_code == 202
        api_client.force_authenticate(user=world["other_user"])
        other = api_client.post("/api/transcripts/enqueue/", {"student_id": world["owner"].id}, format="json")
        assert other.status_code == 403
