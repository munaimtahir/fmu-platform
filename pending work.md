# Pending Work: final verification handoff

Last updated: 2026-09-19 UTC

## Completed

- Backend/web parity implementation is deployed at `3f0bfa4` and production health is green.
- RBAC catalog migration is applied; production has 179 permission tasks.
- OpenAPI generation is deterministic: `/api/health/` is represented by a public API view, `groups_list` has an explicit schema description, both mirrors are regenerated, and `backend/scripts/check_openapi_schema.sh` passes.
- All eight Frozen Pilot Baseline accounts exist and authenticate with the documented baseline password. Rotate these credentials before real users are introduced.
- Frontend gates pass: TypeScript, ESLint, build, strict web parity, and 185 Vitest tests.
- Backend gate passes: 412 tests.
- Live Playwright full project passes: 104/104 tests, including all eight roles and public transcript verification.
- Production smoke passes, including coordinator, finance, and office-assistant coverage.
- Timetable E2E checks are read-only against the zero-data pilot environment. Mutation coverage belongs in the isolated demo-data stack.

## Release and hygiene

- Deployment backups remain under `backups/` locally and are ignored by Git.
- Playwright auth state, reports, result JSON, screenshots, and test uploads must remain untracked.
- Canonical Compose worker service is `worker` with container `vexel_medsims_rq_worker`; references to `rq_worker` are stale.
- Release notes: biometric ingestion is task-gated; voucher cancellation rejects live payments; `/verify/:token` is outside app chrome; `/apply` is removed; learning, notifications, and transcripts use task permissions while preserving existing role access.

## Intentionally deferred

- Timetable recurrence and mobile-only APIs remain outside the web parity scope.
- Production mutation verification remains transaction-scoped or isolated; do not create demo business records in the pilot database.
