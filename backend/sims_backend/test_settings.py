"""Test settings - use SQLite in-memory database for tests."""

from sims_backend import settings as base_settings

# Import all uppercase settings from the base module without using wildcard imports
for setting_name in dir(base_settings):
    if setting_name.isupper():
        globals()[setting_name] = getattr(base_settings, setting_name)

# Override database for testing
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Faster password hashing for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Disable HTTPS redirects for tests
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False


# Disable migrations for tests
class DisableMigrations:
    def __contains__(self, item):
        # Keep the newly registered faculty app's migration available so its
        # model table is created in the SQLite test database. The remaining
        # apps retain the historical no-migrations test behaviour.
        return item != "faculty"

    def __getitem__(self, item):
        if item == "faculty":
            return "sims_backend.faculty.migrations"
        return None


MIGRATION_MODULES = DisableMigrations()
