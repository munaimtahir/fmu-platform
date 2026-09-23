import time

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run student import retention hourly (dedicated Compose maintenance service)."

    def handle(self, *args, **options):
        while True:
            call_command("purge_student_import_artifacts", stdout=self.stdout)
            time.sleep(3600)
