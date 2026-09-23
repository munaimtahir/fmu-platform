"""Learning, notifications and transcripts moved from group checks to task permissions.

These tests pin the legacy access matrix (who could do what before) and the new
explicit-assignment behaviour.
"""

import pytest
from django.apps import apps as django_apps
from django.contrib.auth.models import Group, User

from core.models import PermissionTask, UserTaskAssignment
from core.rbac_catalog import seed_rbac_catalog
from sims_backend.academics.models import Batch, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.notifications.models import NotificationAudience
from sims_backend.students.models import Student

MATERIALS = "/api/learning/materials/"
FEED = "/api/learning/student-feed/"
NOTIFICATIONS = "/api/notifications/"
INBOX = "/api/my/notifications/"
ENQUEUE = "/api/transcripts/enqueue/"


def make_user(name, groups=()):
    user = User.objects.create_user(username=name, password="x")
    for group_name in groups:
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)
    return user


def grant(user, *codes):
    for code in codes:
        task, _ = PermissionTask.objects.get_or_create(
            code=code, defaults={"name": code, "module": code.split(".")[0]}
        )
        UserTaskAssignment.objects.create(user=user, task=task)


def status_for(client, user, method, url, **kwargs):
    client.force_authenticate(user=user)
    return getattr(client, method)(url, format="json", **kwargs).status_code


@pytest.mark.django_db
class TestLearningMaterials:
    @pytest.mark.parametrize("groups", [("FACULTY",), ("Faculty",), ("ADMIN",), ("ADMIN", "FINANCE"), ("ADMIN", "REGISTRAR")])
    def test_faculty_and_admin_keep_access(self, api_client, groups):
        user = make_user("lm_" + "_".join(groups).lower(), groups)
        assert status_for(api_client, user, "get", MATERIALS) == 200
        created = status_for(
            api_client, user, "post", MATERIALS, data={"title": "Notes", "kind": "LINK", "url": "https://example.edu/n"}
        )
        assert created == 201

    @pytest.mark.parametrize("groups", [("STUDENT",), ("FINANCE",), ("EXAMCELL",), ("COORDINATOR",), ("REGISTRAR",)])
    def test_other_roles_remain_denied(self, api_client, groups):
        user = make_user("lm_deny_" + "_".join(groups).lower(), groups)
        assert status_for(api_client, user, "get", MATERIALS) == 403
        assert (
            status_for(api_client, user, "post", MATERIALS, data={"title": "x", "kind": "LINK", "url": "https://e.edu"})
            == 403
        )

    def test_explicit_view_task_opens_read_only(self, api_client):
        user = make_user("lm_examcell", ["EXAMCELL"])
        grant(user, "learning.materials.view")
        assert status_for(api_client, user, "get", MATERIALS) == 200
        assert status_for(api_client, user, "post", MATERIALS, data={"title": "x", "kind": "LINK", "url": "https://e.edu"}) == 403

    def test_publish_and_audience_use_their_own_tasks(self, api_client):
        owner = make_user("lm_owner", ["FACULTY"])
        api_client.force_authenticate(user=owner)
        material = api_client.post(
            MATERIALS, {"title": "T", "kind": "LINK", "url": "https://example.edu/t"}, format="json"
        ).json()
        seed_rbac_catalog(django_apps)
        # A user allowed only to view cannot publish or add audiences.
        viewer = make_user("lm_viewer", ["EXAMCELL"])
        grant(viewer, "learning.materials.view")
        assert status_for(api_client, viewer, "post", f"{MATERIALS}{material['id']}/publish/") == 403
        assert status_for(api_client, viewer, "post", f"{MATERIALS}{material['id']}/audiences/", data={}) == 403
        assert status_for(api_client, viewer, "get", f"{MATERIALS}{material['id']}/audiences/") == 200

    def test_student_feed_is_for_students_only(self, api_client):
        program = Program.objects.create(name="P")
        batch = Batch.objects.create(program=program, name="B", start_year=2024)
        group = StudentGroup.objects.create(batch=batch, name="G")
        student_user = make_user("lm_student", ["Student"])
        make_student(
            user=student_user, reg_no="L-1", name="L", program=program, batch=batch, group=group, email="l@e.edu"
        )
        assert status_for(api_client, student_user, "get", FEED) == 200
        assert status_for(api_client, make_user("lm_fac2", ["FACULTY"]), "get", FEED) == 403
        assert status_for(api_client, make_user("lm_admin_fin", ["ADMIN", "FINANCE"]), "get", FEED) == 403


NOTICE = {
    "title": "Notice",
    "body": "Hello",
    "category": "General",
    "priority": "NORMAL",
    "send_email": False,
    "audiences": [{"audience_type": NotificationAudience.AUDIENCE_ALL_STUDENTS}],
}


@pytest.mark.django_db
class TestNotifications:
    @pytest.mark.parametrize("group", ["ADMIN", "Registrar", "COORDINATOR"])
    def test_notification_admins_keep_access(self, api_client, group):
        user = make_user("na_" + group.lower(), [group])
        assert status_for(api_client, user, "get", NOTIFICATIONS) == 200
        assert status_for(api_client, user, "post", NOTIFICATIONS, data=NOTICE) == 201

    @pytest.mark.parametrize("group", ["STUDENT", "FACULTY", "FINANCE", "EXAMCELL", "OFFICE_ASSISTANT"])
    def test_others_cannot_administer(self, api_client, group):
        user = make_user("nd_" + group.lower(), [group])
        assert status_for(api_client, user, "get", NOTIFICATIONS) == 403
        assert status_for(api_client, user, "post", NOTIFICATIONS, data=NOTICE) == 403

    @pytest.mark.parametrize("group", ["STUDENT", "Student", "REGISTRAR", "COORDINATOR", "ADMIN"])
    def test_inbox_access_matches_legacy(self, api_client, group):
        assert status_for(api_client, make_user("ib_" + group.lower(), [group]), "get", INBOX) == 200

    @pytest.mark.parametrize("group", ["FACULTY", "FINANCE", "EXAMCELL"])
    def test_inbox_denied_for_other_roles(self, api_client, group):
        assert status_for(api_client, make_user("ibd_" + group.lower(), [group]), "get", INBOX) == 403

    def test_send_now_requires_send_task(self, api_client):
        creator = make_user("na_creator", ["OFFICE_ASSISTANT"])
        grant(creator, "notifications.admin.create", "notifications.admin.view")
        assert status_for(api_client, creator, "post", NOTIFICATIONS, data={**NOTICE, "send_now": True}) == 403
        assert status_for(api_client, creator, "post", NOTIFICATIONS, data=NOTICE) == 201


@pytest.mark.django_db
class TestTranscriptTasks:
    @pytest.fixture(autouse=True)
    def fake_queue(self, monkeypatch):
        class _Job:
            id = "job-1"

        class _Connection:
            @staticmethod
            def ping():
                return True

        class _Queue:
            connection = _Connection()

            def enqueue(self, *args, **kwargs):
                return _Job()

        monkeypatch.setattr("core.async_ops.django_rq.get_queue", lambda name: _Queue())
        monkeypatch.setattr(
            "sims_backend.transcripts.views.finance_gate_checks",
            lambda student, _term: {"gating": {"can_view_transcript": True}},
        )

    @pytest.fixture
    def student(self):
        program = Program.objects.create(name="TP")
        batch = Batch.objects.create(program=program, name="TB", start_year=2024)
        group = StudentGroup.objects.create(batch=batch, name="TG")
        return make_student(
            user=make_user("tr_student", ["STUDENT"]),
            reg_no="T-1",
            name="T",
            program=program,
            batch=batch,
            group=group,
            email="t@e.edu",
        )

    def test_examcell_needs_explicit_task(self, api_client, student):
        examcell = make_user("tr_examcell", ["EXAMCELL"])
        payload = {"student_id": student.id}
        assert status_for(api_client, examcell, "post", ENQUEUE, data=payload) == 403
        grant(examcell, "transcripts.transcripts.generate")
        assert status_for(api_client, examcell, "post", ENQUEUE, data=payload) == 202

    def test_emailing_needs_the_email_task_too(self, api_client, student):
        examcell = make_user("tr_examcell2", ["EXAMCELL"])
        grant(examcell, "transcripts.transcripts.generate")
        payload = {"student_id": student.id, "email": "someone@e.edu"}
        assert status_for(api_client, examcell, "post", ENQUEUE, data=payload) == 403
        grant(examcell, "transcripts.transcripts.email")
        assert status_for(api_client, examcell, "post", ENQUEUE, data=payload) == 202

    @pytest.mark.parametrize("groups", [("ADMIN",), ("REGISTRAR",), ("FINANCE",), ("ADMIN", "FINANCE"), ("Registrar",)])
    def test_default_holders_can_generate_and_email(self, api_client, student, groups):
        user = make_user("tr_" + "_".join(groups).lower(), groups)
        payload = {"student_id": student.id, "email": "someone@e.edu"}
        assert status_for(api_client, user, "post", ENQUEUE, data=payload) == 202

    def test_student_own_email_stays_allowed(self, api_client, student):
        payload = {"student_id": student.id, "email": "me@e.edu"}
        assert status_for(api_client, student.user, "post", ENQUEUE, data=payload) == 202


@pytest.mark.django_db
class TestBiometricIngestion:
    URL = "/api/attendance-input/biometric/punches/"

    @pytest.mark.parametrize("groups", [("STUDENT",), ("FACULTY",), ("REGISTRAR",), ("EXAMCELL",), ("FINANCE",), ("COORDINATOR",)])
    def test_only_explicitly_authorised_users_can_ingest(self, api_client, groups):
        user = make_user("bio_" + "_".join(groups).lower(), groups)
        assert status_for(api_client, user, "post", self.URL, data={"punches": []}) == 403

    def test_admin_can_ingest(self, api_client):
        admin = make_user("bio_admin", ["ADMIN"])
        assert status_for(api_client, admin, "post", self.URL, data={"punches": []}) == 200

    def test_explicit_task_grants_ingest(self, api_client):
        user = make_user("bio_assigned", ["FACULTY"])
        grant(user, "attendance.biometric.ingest")
        assert status_for(api_client, user, "post", self.URL, data={"punches": []}) == 200

from sims_backend.students.test_factories import make_student
