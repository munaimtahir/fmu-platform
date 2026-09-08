# Final test results

## Passed

- `python manage.py check` and `check --database default`
- `npm run type-check`
- `npm run lint`
- `npm test -- --run` — 11 files, 49 tests
- `npm run build`
- `docker compose config --quiet` and production Compose config validation
- `git diff --check`

## PostgreSQL validation

A fresh isolated PostgreSQL 16 environment was provisioned with the `vexel_medsims_postgres_data` volume, database `vexel_medsims`, and application user `vexel_medsims_app`. The old volumes were left untouched. Connectivity, `check --database default`, complete migration application, and the live health endpoint all passed; no pending migrations remain.

The complete backend pytest suite now passes: 227 tests collected and passed, with 67% overall coverage. Ruff and mypy pass; explicit package bases removed the duplicate `intake` module finding. Django deployment checks pass with production SSL redirect enabled. DRF Spectacular still emits schema documentation warnings for legacy API views and dynamic serializers; these do not affect runtime behavior and are recorded as follow-up documentation work.

Production SMTP is intentionally deferred and non-blocking. The configured console/test email backend remains available for application-level verification.
