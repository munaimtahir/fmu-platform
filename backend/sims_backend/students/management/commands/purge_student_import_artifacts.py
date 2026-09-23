from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from sims_backend.students.imports.models import ImportJob


class Command(BaseCommand):
    help = "Expire abandoned previews and remove student-import error files after their retention period."

    def add_arguments(self, parser):
        parser.add_argument("--error-file-days", type=int, default=30)

    def handle(self, *args, **options):
        if options["error_file_days"] < 1:
            raise CommandError("--error-file-days must be at least 1")
        now = timezone.now()
        expired = ImportJob.objects.filter(
            status__in=[ImportJob.STATUS_PENDING, ImportJob.STATUS_PREVIEWED],
            expires_at__lt=now,
        )
        expired_count = expired.update(
            status=ImportJob.STATUS_FAILED,
            finished_at=now,
            summary={"error": "Preview expired"},
        )

        cutoff = now - timedelta(days=options["error_file_days"])
        removed = 0
        for job in ImportJob.objects.filter(finished_at__lt=cutoff).exclude(error_report_file="").iterator():
            if job.error_report_file:
                job.error_report_file.delete(save=False)
                job.error_report_file = None
                job.save(update_fields=["error_report_file", "updated_at"])
                removed += 1
        self.stdout.write(self.style.SUCCESS(f"Expired {expired_count} preview(s); removed {removed} error file(s)."))
