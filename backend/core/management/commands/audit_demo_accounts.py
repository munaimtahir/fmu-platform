"""
Read-only audit for demo/seed accounts with predictable default passwords.

Cross-references the username/password patterns documented in
backend/SEED_DATA_README.md and backend/DEMO_SEED_USAGE.md (and produced by
core/management/commands/seed_demo.py and seed_demo_scenarios) against the
users actually present in this database.

This command makes NO writes and NEVER prints a password (real or candidate) -
it only reports, per matched account, whether the account's current password
equals the known demo default for its username pattern. Use the output to
decide which accounts need rotating or disabling; rotation itself is a
separate, explicitly-confirmed action, not something this command does.

Usage:
    python manage.py audit_demo_accounts
    docker compose exec backend python manage.py audit_demo_accounts
"""

import re

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

# Fixed-username demo accounts and their documented default passwords.
# Source: SEED_DATA_README.md, DEMO_SEED_USAGE.md, seed_demo.py, e2e.yml.
FIXED_DEMO_ACCOUNTS = {
    "admin": "admin123",
    "registrar": "registrar123",
    "faculty": "faculty123",
    "faculty1": "faculty123",
    "faculty2": "faculty123",
    "faculty3": "faculty123",
    "student": "student123",
    "student_defaulter": "student123",
    "student_partial": "student123",
    "student_waiver": "student123",
    "student_reversal": "student123",
    "finance": "finance123",
    "examcell": "examcell123",
    "demo_faculty1": "faculty123",
    "demo_faculty2": "faculty123",
}

# Dynamic username patterns -> function computing the expected password
# from the regex match groups.
DYNAMIC_DEMO_PATTERNS = [
    # seed_demo.py: username "student{year}mbbs{n}", password "student{year}"
    (re.compile(r"^student(?P<year>\d{4})mbbs\d{3}$"), lambda m: f"student{m.group('year')}"),
    # seed_demo_scenarios: username "demo_studentNNN", password "demo123"
    (re.compile(r"^demo_student\d{3}$"), lambda m: "demo123"),
]


class Command(BaseCommand):
    help = (
        "Audit demo/seed accounts for predictable default passwords. "
        "Read-only: never prints password values, never modifies data."
    )

    def handle(self, *args, **options):
        rows = []
        for user in User.objects.all().order_by("username"):
            expected_password = FIXED_DEMO_ACCOUNTS.get(user.username)
            if expected_password is None:
                for pattern, password_fn in DYNAMIC_DEMO_PATTERNS:
                    match = pattern.match(user.username)
                    if match:
                        expected_password = password_fn(match)
                        break
            if expected_password is None:
                continue

            matches_demo_password = user.check_password(expected_password)
            rows.append(
                {
                    "username": user.username,
                    "email": user.email,
                    "is_active": user.is_active,
                    "date_joined": user.date_joined.date().isoformat() if user.date_joined else "",
                    "last_login": user.last_login.date().isoformat() if user.last_login else "never",
                    "matches_demo_password": matches_demo_password,
                }
            )

        if not rows:
            self.stdout.write(self.style.SUCCESS("No usernames matched known demo/seed account patterns."))
            return

        header = f"{'USERNAME':<28}{'EMAIL':<38}{'ACTIVE':<8}{'JOINED':<12}{'LAST LOGIN':<12}{'DEMO PASSWORD?'}"
        self.stdout.write(header)
        self.stdout.write("-" * len(header))

        flagged = 0
        for row in rows:
            if row["matches_demo_password"]:
                flagged += 1
            self.stdout.write(
                f"{row['username']:<28}{row['email']:<38}{str(row['is_active']):<8}"
                f"{row['date_joined']:<12}{row['last_login']:<12}{row['matches_demo_password']}"
            )

        self.stdout.write("")
        self.stdout.write(
            f"{len(rows)} account(s) match known demo/seed username patterns; "
            f"{flagged} still use the documented default password."
        )
        if flagged:
            self.stdout.write(
                self.style.WARNING(
                    "Review the flagged accounts above: confirm whether each is a real "
                    "production account (do not assume from username alone) and, for "
                    "confirmed demo/QA-only accounts, rotate to a strong unique password "
                    "or disable them. This command performs no writes."
                )
            )
