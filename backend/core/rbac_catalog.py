"""Canonical RBAC catalog: task codes, system roles and built-in role grants.

This module is the single source of truth for:

* ``TASK_CODES``: every permission task code enforced by a viewset.  A test
  scans the backend for ``required_tasks`` / ``has_permission_task`` usages and
  fails when a code is missing here, so the catalog cannot drift.
* ``SYSTEM_ROLES``: the built-in roles.  Role names equal the canonical Django
  Group names because ``core.permissions.get_user_roles`` links groups to roles
  by (case-insensitive) name.
* ``BUILTIN_ROLE_PREFIXES``: what each built-in role is granted when no explicit
  task assignment exists.  ``core.permissions`` evaluates these on every check,
  so seeding task rows never removes access.

``seed_rbac_catalog`` is idempotent and never modifies or deletes existing
assignments.
"""

from __future__ import annotations

TASK_CODES: tuple[str, ...] = (
    # academics
    "academics.batches.create",
    "academics.batches.delete",
    "academics.batches.update",
    "academics.batches.view",
    "academics.blocks.create",
    "academics.blocks.delete",
    "academics.blocks.update",
    "academics.blocks.view",
    "academics.courses.create",
    "academics.courses.delete",
    "academics.courses.update",
    "academics.courses.view",
    "academics.departments.create",
    "academics.departments.delete",
    "academics.departments.update",
    "academics.departments.view",
    "academics.groups.create",
    "academics.groups.delete",
    "academics.groups.update",
    "academics.groups.view",
    "academics.modules.create",
    "academics.modules.delete",
    "academics.modules.update",
    "academics.modules.view",
    "academics.periods.create",
    "academics.periods.delete",
    "academics.periods.update",
    "academics.periods.view",
    "academics.programs.create",
    "academics.programs.delete",
    "academics.programs.manage",
    "academics.programs.update",
    "academics.programs.view",
    "academics.sections.create",
    "academics.sections.delete",
    "academics.sections.update",
    "academics.sections.view",
    "academics.terms.create",
    "academics.terms.delete",
    "academics.terms.manage",
    "academics.terms.update",
    "academics.terms.view",
    "academics.tracks.create",
    "academics.tracks.delete",
    "academics.tracks.update",
    "academics.tracks.view",
    # attendance
    "attendance.attendances.edit",
    "attendance.attendances.view",
    "attendance.biometric.ingest",
    # audit
    "audit.events.export",
    "audit.events.view",
    # compliance
    "compliance.definitions.create",
    "compliance.definitions.delete",
    "compliance.definitions.update",
    "compliance.definitions.view",
    "compliance.requirements.assign",
    "compliance.requirements.manage",
    "compliance.requirements.review",
    "compliance.requirements.view",
    # core
    "core.permission_tasks.view",
    "core.role_task_assignments.create",
    "core.role_task_assignments.delete",
    "core.role_task_assignments.view",
    "core.roles.create",
    "core.roles.delete",
    "core.roles.update",
    "core.roles.view",
    "core.user_task_assignments.create",
    "core.user_task_assignments.delete",
    "core.user_task_assignments.view",
    # exams
    "exams.components.create",
    "exams.components.delete",
    "exams.components.update",
    "exams.components.view",
    "exams.exams.create",
    "exams.exams.delete",
    "exams.exams.publish",
    "exams.exams.update",
    "exams.exams.view",
    # finance
    "finance.adjustments.approve",
    "finance.adjustments.create",
    "finance.adjustments.delete",
    "finance.adjustments.update",
    "finance.adjustments.view",
    "finance.fee_plans.create",
    "finance.fee_plans.delete",
    "finance.fee_plans.update",
    "finance.fee_plans.view",
    "finance.fee_types.create",
    "finance.fee_types.delete",
    "finance.fee_types.update",
    "finance.fee_types.view",
    "finance.ledger_entries.view",
    "finance.payments.create",
    "finance.payments.delete",
    "finance.payments.reverse",
    "finance.payments.update",
    "finance.payments.verify",
    "finance.payments.view",
    "finance.policies.create",
    "finance.policies.delete",
    "finance.policies.update",
    "finance.policies.view",
    "finance.reports.view",
    "finance.summary.view",
    "finance.vouchers.cancel",
    "finance.vouchers.create",
    "finance.vouchers.delete",
    "finance.vouchers.generate",
    "finance.vouchers.reconcile",
    "finance.vouchers.update",
    "finance.vouchers.view",
    # learning
    "learning.feed.view",
    "learning.materials.archive",
    "learning.materials.create",
    "learning.materials.delete",
    "learning.materials.manage_audience",
    "learning.materials.publish",
    "learning.materials.update",
    "learning.materials.view",
    # notifications
    "notifications.admin.create",
    "notifications.admin.send",
    "notifications.admin.view",
    "notifications.inbox.update",
    "notifications.inbox.view",
    # people
    "people.addresses.create",
    "people.addresses.delete",
    "people.addresses.update",
    "people.addresses.view",
    "people.contact_info.create",
    "people.contact_info.delete",
    "people.contact_info.update",
    "people.contact_info.view",
    "people.identity_documents.create",
    "people.identity_documents.delete",
    "people.identity_documents.update",
    "people.identity_documents.view",
    "people.persons.create",
    "people.persons.delete",
    "people.persons.update",
    "people.persons.view",
    # results
    "results.result_components.create",
    "results.result_components.delete",
    "results.result_components.update",
    "results.result_components.view",
    "results.result_corrections.create",
    "results.result_corrections.review",
    "results.result_headers.create",
    "results.result_headers.delete",
    "results.result_headers.freeze",
    "results.result_headers.publish",
    "results.result_headers.update",
    "results.result_headers.verify",
    "results.result_headers.view",
    # students
    "students.leave_periods.create",
    "students.leave_periods.delete",
    "students.leave_periods.update",
    "students.leave_periods.view",
    "students.students.manage_placement",
    "students.students.manage_profile",
    "students.students.manage_status",
    "students.students.view",
    "students.imports.execute",
    "students.imports.view",
    "students.onboarding.view",
    # timetable
    "timetable.entries.cancel",
    "timetable.entries.create",
    "timetable.entries.delete",
    "timetable.entries.update",
    "timetable.entries.view",
    "timetable.sessions.create",
    "timetable.sessions.delete",
    "timetable.sessions.update",
    "timetable.sessions.view",
    "timetable.weekly.create",
    "timetable.weekly.delete",
    "timetable.weekly.manage",
    "timetable.weekly.update",
    "timetable.weekly.view",
    # transcripts
    "transcripts.transcripts.email",
    "transcripts.transcripts.generate",
)

# name -> description.  ADMIN is implicit-all (see BUILTIN_ADMIN_ALWAYS_PREFIXES).
SYSTEM_ROLES: dict[str, str] = {
    "ADMIN": "Full administrative access (built-in). Grants every task unless the user also holds a domain role.",
    "REGISTRAR": "Owns student, person, academic and timetable records and compliance administration.",
    "FACULTY": "Teaching staff: timetable, draft gradebook entry and learning materials.",
    "STUDENT": "Student self-service: own schedule, learning feed, notifications and compliance.",
    "EXAMCELL": "Examination cell: exams, results verification and publication.",
    "FINANCE": "Finance office: fees, vouchers, payments, ledger and transcripts.",
    "COORDINATOR": "Program coordinator: timetable management, placement and notifications.",
    "OFFICE_ASSISTANT": "Data-entry support role. No tasks by default; assign explicitly.",
}

# Prefix (or exact code) grants per built-in role.  A code is granted when it
# equals an entry or starts with it.  Mirrors the pre-catalog behaviour exactly,
# plus the new learning / notifications / transcripts / compliance modules.
BUILTIN_ROLE_PREFIXES: dict[str, tuple[str, ...]] = {
    "REGISTRAR": (
        # Registrar owns authoritative student, person, academic-lifecycle and
        # timetable records.  Viewsets still enforce action and object rules.
        "students.",
        "people.",
        "academics.",
        "timetable.",
        "compliance.",
        "notifications.",
        "transcripts.",
    ),
    "FACULTY": (
        "academics.courses.view",
        "academics.sections.view",
        "students.students.view",
        # Read-only batch/period/group access drives the /timetable selectors.
        "academics.batches.view",
        "academics.terms.view",
        "academics.groups.view",
        "results.result_headers.view",
        "results.result_headers.create",
        "results.result_headers.update",
        "results.result_components.view",
        "results.result_components.create",
        "results.result_components.update",
        "results.result_components.delete",
        "exams.exams.view",
        "exams.components.view",
        # Own sessions / draft timetables / entries (object-level ownership is
        # enforced in the views); no hard-delete of entries.
        "timetable.sessions.view",
        "timetable.sessions.create",
        "timetable.sessions.update",
        "timetable.sessions.delete",
        "timetable.weekly.view",
        "timetable.weekly.create",
        "timetable.weekly.update",
        "timetable.weekly.manage",
        "timetable.entries.view",
        "timetable.entries.create",
        "timetable.entries.update",
        "timetable.entries.cancel",
        "learning.materials.",
    ),
    "EXAMCELL": (
        "exams.",
        "results.",
    ),
    "FINANCE": (
        "finance.",
        "transcripts.",
    ),
    "COORDINATOR": (
        "timetable.",
        "academics.programs.view",
        "academics.batches.view",
        "academics.terms.view",
        "academics.groups.view",
        "students.students.view",
        "students.students.manage_placement",
        "students.imports.",
        "students.onboarding.view",
        "notifications.",
    ),
    "STUDENT": (
        # Published schedules only; queryset filtering in the views still
        # restricts students to their own / published data.
        "timetable.sessions.view",
        "timetable.weekly.view",
        "timetable.entries.view",
        "learning.feed.view",
        "notifications.inbox.",
    ),
}

# The ADMIN group is implicit-all only when the user holds no other domain role
# (so an Admin+Finance pilot account is scoped like Finance).  For modules that
# historically checked ``in_group(user, "ADMIN")`` non-exclusively, ADMIN keeps
# access regardless of other groups.
BUILTIN_ADMIN_ALWAYS_PREFIXES: tuple[str, ...] = ("learning.materials.", "notifications.", "transcripts.")

# Groups that stop ADMIN from being implicit-all (domain roles).
DOMAIN_ROLE_GROUPS: tuple[str, ...] = (
    "REGISTRAR",
    "EXAMCELL",
    "FACULTY",
    "FINANCE",
    "STUDENT",
    "COORDINATOR",
    "OFFICE_ASSISTANT",
)


def task_name(code: str) -> str:
    """Human-readable name derived from a code, e.g. ``finance.vouchers.cancel`` -> ``Cancel vouchers``."""
    _module, resource, verb = code.split(".", 2)
    return f"{verb.replace('_', ' ').capitalize()} {resource.replace('_', ' ')}"


def task_module(code: str) -> str:
    return code.split(".", 1)[0]


def builtin_prefix_grants(role: str, code: str) -> bool:
    return any(code == item or code.startswith(item) for item in BUILTIN_ROLE_PREFIXES.get(role, ()))


def seed_rbac_catalog(apps) -> dict[str, int]:
    """Create missing tasks, system roles and default role-task assignments.

    ``apps`` is either the global registry or a migration ``apps`` argument.
    Existing rows and assignments are never modified or removed.
    """
    permission_task = apps.get_model("core", "PermissionTask")
    role_model = apps.get_model("core", "Role")
    assignment_model = apps.get_model("core", "RoleTaskAssignment")

    created = {"tasks": 0, "roles": 0, "assignments": 0}

    tasks = {}
    for code in TASK_CODES:
        task, was_created = permission_task.objects.get_or_create(
            code=code,
            defaults={"name": task_name(code), "module": task_module(code)},
        )
        tasks[code] = task
        created["tasks"] += int(was_created)

    roles = {}
    for name, description in SYSTEM_ROLES.items():
        role = role_model.objects.filter(name__iexact=name).first()
        if role is None:
            role = role_model.objects.create(name=name, description=description, is_system_role=True)
            created["roles"] += 1
        roles[name] = role

    for role_name in BUILTIN_ROLE_PREFIXES:
        for code, task in tasks.items():
            if builtin_prefix_grants(role_name, code):
                _, was_created = assignment_model.objects.get_or_create(role=roles[role_name], task=task)
                created["assignments"] += int(was_created)

    return created
