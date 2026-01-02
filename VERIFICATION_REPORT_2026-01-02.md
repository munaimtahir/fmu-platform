# Demo Readiness Verification – 2026-01-02

## Scope
- Environment sanity for backend/frontend.
- Database readiness and migration plan.
- Demo data seeding paths and academic flow coverage.

## What Changed
- Updated `.env` for local/dev runs (SQLite backend, localhost origins, API base URL) to unblock non-docker workflows. This keeps CORS/CSRF aligned with the exposed ports and avoids Postgres dependency during validation.

## Progress & Checks
- Repository is clean and on branch `work`; no upstream remote is configured for pull/ff sync.
- Docker is unavailable in the current runner (`docker` command missing), so compose-based flows cannot be exercised.
- Dependency installation via pip is blocked by the enforced proxy (403 CONNECT), preventing Django + DRF installation and any runtime validation (migrations, server start, tests).

## Blockers
- **Dependency fetch**: Pip cannot reach PyPI through the proxy; all install attempts fail with 403 CONNECT errors. Until Python dependencies are installable, migrations, management commands, and automated tests cannot run.
- **Service runtime**: With Docker unavailable and dependencies missing, API/Frontend health checks cannot be executed.

## Path to Green (once network/package access is restored)
1. Install backend deps in the project venv:
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r backend/requirements.txt`
2. Run migrations on SQLite (current `.env`):
   - `python backend/manage.py migrate`
3. Seed realistic demo data (20+ students touching timetable, attendance, fees, and assessments):
   - `python backend/manage.py seed_demo_scenarios --students 24 --reset`
   - `python backend/manage.py seed_demo --students 24 --clear`
4. Validate academic loop:
   - Timetable: create/verify/publish sessions from the seeded periods.
   - Attendance: mark mixed present/absent via `core.demo_scenarios.create_attendance_for_student`.
   - Fees: generate challans via `core.demo_scenarios.create_challan_for_student`; mark mixed paid/unpaid.
   - Assessments: ensure `ResultHeader` statuses flow Draft → Verified → Published with linked `ResultComponentEntry`.
5. Frontend/API smoke:
   - `npm install && npm run build` (or Docker flow if available).
   - Manual auth for Admin, Faculty, Student using seeded credentials.

## Outstanding Risks
- No runtime validation performed yet (blocked by package fetch).
- Tagging `mvp-demo-ready` should wait until migrations + seeded data + UI/API checks complete on a machine with package access.

