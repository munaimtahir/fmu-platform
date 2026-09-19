import ast
import pathlib
import re

import pytest
from django.apps import apps as django_apps
from django.contrib.auth.models import Group, User

from core.models import PermissionTask, Role, RoleTaskAssignment, UserTaskAssignment
from core.permissions import (
    get_effective_roles,
    get_effective_task_codes,
    get_user_roles,
    has_permission_task,
)
from core.rbac_catalog import BUILTIN_ROLE_PREFIXES, SYSTEM_ROLES, TASK_CODES, seed_rbac_catalog

BACKEND_ROOT = pathlib.Path(__file__).resolve().parent.parent
APP_MODULES = {c.split(".")[0] for c in TASK_CODES}
CODE_PATTERN = re.compile(r"^([a-z][a-z_]*)\.([a-z][a-z_]*)\.([a-z][a-z_]*)$")
SKIP_PARTS = {"tests", "migrations", ".venv", "venv", "site-packages", "node_modules", "__pycache__"}

GROUP_CONFIGS = [
    (),
    ("STUDENT",),
    ("Student",),
    ("FACULTY",),
    ("Faculty",),
    ("REGISTRAR",),
    ("EXAMCELL",),
    ("FINANCE",),
    ("COORDINATOR",),
    ("OFFICE_ASSISTANT",),
    ("ADMIN",),
    ("Admin",),
    ("ADMIN", "FINANCE"),
    ("ADMIN", "REGISTRAR"),
    ("ADMIN", "STUDENT"),
]


def make_user(name, groups=()):
    user = User.objects.create_user(username=name, password="x")
    for group_name in groups:
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)
    return user


def access_map(user):
    return {code: has_permission_task(user, code) for code in TASK_CODES}


def used_task_codes():
    found = {}
    for path in BACKEND_ROOT.rglob("*.py"):
        if SKIP_PARTS.intersection(path.parts):
            continue
        try:
            tree = ast.parse(path.read_text())
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                m = CODE_PATTERN.match(node.value)
                if m and m.group(1) in APP_MODULES:
                    found.setdefault(node.value, path.relative_to(BACKEND_ROOT).as_posix())
    return found


class TestCatalogShape:
    def test_codes_are_unique_three_part_and_sorted_into_modules(self):
        assert len(TASK_CODES) == len(set(TASK_CODES))
        assert all(len(code.split(".")) == 3 for code in TASK_CODES)

    def test_every_code_used_by_backend_is_in_catalog(self):
        missing = {c: p for c, p in used_task_codes().items() if c not in TASK_CODES}
        assert not missing, f"Add these task codes to core/rbac_catalog.py TASK_CODES: {missing}"

    def test_every_builtin_prefix_grants_something(self):
        for role, prefixes in BUILTIN_ROLE_PREFIXES.items():
            assert role in SYSTEM_ROLES
            for prefix in prefixes:
                assert any(c == prefix or c.startswith(prefix) for c in TASK_CODES), (role, prefix)

    def test_new_workflow_codes_exist(self):
        for code in [
            "finance.vouchers.cancel",
            "learning.materials.publish",
            "learning.feed.view",
            "notifications.admin.send",
            "notifications.inbox.update",
            "transcripts.transcripts.generate",
            "transcripts.transcripts.email",
            "compliance.requirements.review",
        ]:
            assert code in TASK_CODES


@pytest.mark.django_db
class TestSeed:
    def test_seed_creates_tasks_roles_and_assignments(self):
        created = seed_rbac_catalog(django_apps)
        assert created["tasks"] == len(TASK_CODES)
        assert created["roles"] == len(SYSTEM_ROLES)
        assert PermissionTask.objects.count() == len(TASK_CODES)
        assert set(Role.objects.values_list("name", flat=True)) == set(SYSTEM_ROLES)
        assert Role.objects.filter(is_system_role=True).count() == len(SYSTEM_ROLES)
        assert RoleTaskAssignment.objects.filter(role__name="FACULTY", task__code="learning.materials.publish").exists()
        assert not RoleTaskAssignment.objects.filter(role__name="ADMIN").exists()
        assert not RoleTaskAssignment.objects.filter(role__name="EXAMCELL", task__code="transcripts.transcripts.generate").exists()

    def test_seed_is_idempotent(self):
        seed_rbac_catalog(django_apps)
        counts = (PermissionTask.objects.count(), Role.objects.count(), RoleTaskAssignment.objects.count())
        second = seed_rbac_catalog(django_apps)
        assert second == {"tasks": 0, "roles": 0, "assignments": 0}
        assert counts == (PermissionTask.objects.count(), Role.objects.count(), RoleTaskAssignment.objects.count())

    def test_seed_keeps_existing_rows_and_assignments(self):
        existing = Role.objects.create(name="Registrar", description="custom text", is_system_role=False)
        task = PermissionTask.objects.create(code="finance.vouchers.cancel", name="Custom name", module="finance")
        RoleTaskAssignment.objects.create(role=existing, task=task)

        seed_rbac_catalog(django_apps)

        assert Role.objects.filter(name__iexact="REGISTRAR").count() == 1
        existing.refresh_from_db()
        assert existing.description == "custom text"
        assert existing.is_system_role is False
        task.refresh_from_db()
        assert task.name == "Custom name"
        assert RoleTaskAssignment.objects.filter(role=existing, task=task).exists()

    @pytest.mark.parametrize("groups", GROUP_CONFIGS, ids=lambda g: "+".join(g) or "no-groups")
    def test_seeding_never_changes_effective_access(self, groups):
        user = make_user("u_" + "_".join(groups).lower(), groups)
        before = access_map(user)
        seed_rbac_catalog(django_apps)
        after = access_map(user)
        assert before == after

    def test_task_rows_without_role_rows_do_not_revoke_builtin_access(self):
        faculty = make_user("fac_norole", ["FACULTY"])
        seed_rbac_catalog(django_apps)
        Role.objects.all().delete()
        assert has_permission_task(faculty, "results.result_headers.view")
        assert has_permission_task(faculty, "learning.materials.create")
        assert not has_permission_task(faculty, "finance.vouchers.cancel")


@pytest.mark.django_db
class TestRoleMatchingAndOverrides:
    def test_group_and_role_names_match_case_insensitively(self):
        seed_rbac_catalog(django_apps)
        user = make_user("mixed_case_student", ["Student"])
        assert [r.name for r in get_user_roles(user)] == ["STUDENT"]

    def test_role_assignment_grants_task_to_group_members(self):
        seed_rbac_catalog(django_apps)
        assistant = make_user("assistant", ["OFFICE_ASSISTANT"])
        assert not has_permission_task(assistant, "exams.exams.view")
        RoleTaskAssignment.objects.create(
            role=Role.objects.get(name="OFFICE_ASSISTANT"), task=PermissionTask.objects.get(code="exams.exams.view")
        )
        assert has_permission_task(assistant, "exams.exams.view")
        assert "exams.exams.view" in get_effective_task_codes(assistant)

    def test_direct_assignment_grants_explicit_transcript_task_to_examcell(self):
        seed_rbac_catalog(django_apps)
        examcell = make_user("examcell_direct", ["EXAMCELL"])
        assert not has_permission_task(examcell, "transcripts.transcripts.generate")
        UserTaskAssignment.objects.create(user=examcell, task=PermissionTask.objects.get(code="transcripts.transcripts.generate"))
        assert has_permission_task(examcell, "transcripts.transcripts.generate")

    def test_superuser_has_everything(self):
        superuser = User.objects.create_superuser(username="root", password="x")
        assert get_effective_task_codes(superuser) == set(TASK_CODES)
        assert all(has_permission_task(superuser, c) for c in TASK_CODES)


@pytest.mark.django_db
class TestEffectiveAccessMatchesEnforcement:
    @pytest.mark.parametrize("seeded", [False, True], ids=["unseeded", "seeded"])
    @pytest.mark.parametrize("groups", GROUP_CONFIGS, ids=lambda g: "+".join(g) or "no-groups")
    def test_effective_codes_equal_enforced_codes(self, groups, seeded):
        if seeded:
            seed_rbac_catalog(django_apps)
        user = make_user("eff_" + "_".join(groups).lower(), groups)
        enforced = {c for c in TASK_CODES if has_permission_task(user, c)}
        assert get_effective_task_codes(user) & set(TASK_CODES) == enforced

    def test_effective_roles_are_complete_without_role_rows(self):
        user = make_user("pilot_reg", ["ADMIN", "Registrar"])
        roles = get_effective_roles(user)
        assert [r["name"] for r in roles] == ["ADMIN", "REGISTRAR"]
        assert all(r["id"] is None for r in roles)

    def test_effective_roles_use_role_rows_when_seeded(self):
        seed_rbac_catalog(django_apps)
        user = make_user("stu_roles", ["Student"])
        roles = get_effective_roles(user)
        assert [r["name"] for r in roles] == ["STUDENT"]
        assert roles[0]["id"] is not None
