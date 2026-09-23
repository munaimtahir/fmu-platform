"""Run browser acceptance against a fresh disposable database, never an app database."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SECRET_KEY", "isolated-onboarding-browser-test-secret-9482")
os.environ["DJANGO_SETTINGS_MODULE"] = "sims_backend.test_settings"

import django
from django.conf import settings
from django.core.management import call_command

with tempfile.TemporaryDirectory(prefix="fmu-onboarding-e2e-") as directory:
    settings.DATABASES["default"]["NAME"] = str(Path(directory) / "db.sqlite3")
    settings.MIGRATION_MODULES = {}
    settings.MEDIA_ROOT = str(Path(directory) / "media")
    settings.PRIVATE_MEDIA_ROOT = str(Path(directory) / "private")
    settings.ALLOWED_HOSTS = ["127.0.0.1", "localhost", "testserver"]
    django.setup()
    call_command("migrate", verbosity=0, interactive=False)
    from django.contrib.auth.models import User, Group
    User.objects.create_superuser(username="browser-admin", password="Browser-Admin-9482!")
    Group.objects.get_or_create(name="STUDENT")
    call_command("runserver", "127.0.0.1:8021", use_reloader=False)
