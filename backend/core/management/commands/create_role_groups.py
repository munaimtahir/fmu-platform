"""
Management command to create role groups for the MVP implementation.
Creates all 6 role groups: ADMIN, COORDINATOR, FACULTY, FINANCE, STUDENT, OFFICE_ASSISTANT
"""

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    A Django management command to create role groups for the MVP.

    This command creates all required role groups using get_or_create to ensure
    idempotency (safe to run multiple times).
    """

    help = "Creates role groups for the MVP implementation (ADMIN, COORDINATOR, FACULTY, FINANCE, STUDENT, OFFICE_ASSISTANT)"

    def handle(self, *args, **options):
        """Create all role groups."""
        roles = [
            "ADMIN",
            "COORDINATOR",
            "FACULTY",
            "FINANCE",
            "STUDENT",
            "OFFICE_ASSISTANT",
        ]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Creating Role Groups for MVP"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        created_count = 0
        existing_count = 0

        for role in roles:
            group, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created group: {role}")
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f"→ Group already exists: {role}")
                )
                existing_count += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(
            self.style.SUCCESS(
                f"Summary: {created_count} created, {existing_count} already existed"
            )
        )

        # Verify all groups exist
        self.stdout.write("")
        self.stdout.write("Verifying all role groups exist...")
        missing_groups = []
        for role in roles:
            if not Group.objects.filter(name=role).exists():
                missing_groups.append(role)

        if missing_groups:
            self.stdout.write(
                self.style.ERROR(
                    f"ERROR: Missing groups: {', '.join(missing_groups)}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS("✓ All 6 role groups verified successfully")
        )
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("Role groups setup complete!")
        )







