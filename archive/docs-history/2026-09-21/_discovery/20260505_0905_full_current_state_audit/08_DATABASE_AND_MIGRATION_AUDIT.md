# 08. Database and Migration Audit

**Date Executed**: Tue May 5 09:15 UTC 2026

## Migration Status
- Running `python manage.py showmigrations` locally fails with `django.db.utils.OperationalError: could not translate host name "db" to address`. This indicates that the backend expects to connect to a PostgreSQL instance on a host named `db`, which is standard for the Docker Compose environment but fails in a local isolated execution without environment overrides.
- Therefore, local non-Docker migration verification cannot complete successfully without setting up a local `.env` with a local database configuration or starting the Docker stack.

## Architecture
- Based on `requirements.txt` (`psycopg2-binary==2.9.10`), the primary database is PostgreSQL.
- Models include support for tracking state via `django-simple-history`, as noted in the requirements.