"""
Management command to seed the 8 "Frozen Pilot Baseline" accounts documented in
docs/_freeze/06_PILOT_BASELINE_POLICY.md and required by the Playwright e2e
suite's global setup (frontend/e2e/global.setup.ts, frontend/e2e/data/test-data.ts).

Until this command existed, no seed command and no CI step actually created
these accounts — seed_timetable_demo.py created two of the eight
(pilot_faculty/pilot_student) as a side effect of seeding timetable data, and
the rest were historically created manually against a persistent baseline DB.
That meant a fresh environment (including .github/workflows/e2e.yml, which is
workflow_dispatch-only and had apparently never actually been run) would fail
at global setup before any Playwright test could run.

Idempotent (get_or_create / set_password on every run), matching the pattern
used by seed_demo.py and create_role_groups.py.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

User = get_user_model()

PILOT_BASELINE_PASSWORD = "password123"

# (username, role group, is_superuser)
PILOT_ACCOUNTS = [
    ("pilot_admin", "ADMIN", True),
    ("pilot_registrar", "REGISTRAR", False),
    ("pilot_examcell", "EXAMCELL", False),
    ("pilot_coordinator", "COORDINATOR", False),
    ("pilot_faculty", "FACULTY", False),
    ("pilot_finance", "FINANCE", False),
    ("pilot_student", "STUDENT", False),
    ("pilot_office", "OFFICE_ASSISTANT", False),
]


class Command(BaseCommand):
    help = (
        "Seed the 8 Frozen Pilot Baseline accounts (pilot_admin, pilot_registrar, "
        "pilot_examcell, pilot_coordinator, pilot_faculty, pilot_finance, "
        "pilot_student, pilot_office) required by the Playwright e2e suite's "
        "global setup. See docs/_freeze/06_PILOT_BASELINE_POLICY.md."
    )

    def handle(self, *args, **options):
        self.stdout.write("Seeding Frozen Pilot Baseline accounts...")

        for username, group_name, is_super in PILOT_ACCOUNTS:
            group, _ = Group.objects.get_or_create(name=group_name)
            email = f"{username}@local.test"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "is_staff": is_super,
                    "is_superuser": is_super,
                },
            )
            user.set_password(PILOT_BASELINE_PASSWORD)
            user.email = email
            if is_super:
                user.is_staff = True
                user.is_superuser = True
            user.save()
            user.groups.add(group)

            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created {username} ({group_name})"))
            else:
                self.stdout.write(f"  → {username} already existed ({group_name}); password/group reset")

        self.stdout.write(self.style.SUCCESS(
            f"✅ Frozen Pilot Baseline seeded: {len(PILOT_ACCOUNTS)} accounts, "
            f"password '{PILOT_BASELINE_PASSWORD}' (baseline-only, per credential safety policy)."
        ))
