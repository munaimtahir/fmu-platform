"""
FMU Platform — Cursor Pro Master Prompt Generator (Python)

What this does:
- Prints a single, detailed Cursor prompt that:
  1) verifies backend/db schema,
  2) fixes remaining issues (tests, imports, API/UI mismatches),
  3) builds missing frontend screens for Academics hierarchy (Periods/Tracks/Blocks/Modules),
  4) wires API + UI,
  5) adds & runs backend tests + E2E (Playwright),
  6) produces reports and a verification playbook.

How to use:
- Save as: tools/generate_cursor_prompt.py (or anywhere)
- Run: python tools/generate_cursor_prompt.py
- Copy the printed prompt into Cursor chat.

Optional:
- Set PROJECT_NAME or service/container names below if yours differ.
"""

from __future__ import annotations

PROJECT_NAME = "FMU Platform"
BACKEND_CONTAINER = "fmu_backend"
DB_CONTAINER = "fmu_db"
FRONTEND_CONTAINER = "fmu_frontend"

PROMPT = f"""
TITLE: {PROJECT_NAME} — Cursor Pro Master Task (Post-Recovery Completion: UI Coverage + Tests + E2E + Verification)

ROLE
You are an autonomous senior engineer (Full-stack + QA + DevOps). The project has completed the core recovery (DB schema/migrations now aligned and committed). Your job is to finish the remaining work: run full verification, fix remaining errors, complete frontend coverage for canonical backend modules, implement E2E tests, and produce final reports.

NON-NEGOTIABLES
- Do not introduce broad try/except to hide failures.
- Prefer deterministic fixes: correct migrations, serializers, routers, permissions, env config.
- All changes must be committed in small logical commits.
- Always update the docs artifacts requested below.
- Use existing project conventions (lint, formatting, testing setup).
- If a step reveals missing context, discover it from the repo (don't ask the user).

CURRENT CONTEXT (KNOWN)
- Docker containers (already running on server):
  - backend: {BACKEND_CONTAINER}
  - db: {DB_CONTAINER}
  - frontend: {FRONTEND_CONTAINER}
- Previous root-cause was schema mismatch ("column does not exist") and has been fixed; migrations committed.

PRIMARY GOALS (Definition of Done)
1) Backend:
   - Backend test suite passes (pytest or manage.py test).
   - No admin 500s for canonical models (at least Program and Student).
   - No Postgres "column/relation does not exist" errors during normal usage.
2) Frontend:
   - UI exists for every canonical backend resource in Academics hierarchy:
     - Programs, Periods, Tracks, Blocks, Modules
   - Each resource has: List + Create + Edit + Detail (and Delete if supported).
   - API wiring correct; validation errors shown; success updates UI state.
3) QA:
   - E2E suite implemented and passing (Playwright preferred).
   - Smoke test script exists and passes.
4) Docs:
   - Updated coverage matrices + playbook + final report.

FILES TO CREATE/UPDATE (MANDATORY OUTPUTS)
- docs/diagnostics/POST_RECOVERY_AUDIT.md
- docs/verification/BACKEND_TEST_RESULTS.md
- docs/verification/E2E_TEST_RESULTS.md
- docs/verification/FRONTEND_COVERAGE_MATRIX.md (update to 100%)
- docs/verification/BACKEND_CRUD_MATRIX.md (update, confirm 201/200s)
- docs/verification/VERIFICATION_PLAYBOOK.md (final)
- docs/reports/FINAL_SYSTEM_STATUS.md
- scripts/smoke_test.sh (or scripts/smoke_test.py)
- e2e/ (Playwright tests) OR cypress/ (if repo already uses Cypress)

PHASE 1 — BASELINE CHECKS (NO CODE CHANGES)
1) Repo inventory:
   - Identify Django settings, INSTALLED_APPS, API routers, key models in academics + students.
   - Identify frontend routing and API client location.
   - Identify existing test framework (pytest vs unittest), existing e2e setup (if any).
   - Document findings in docs/diagnostics/POST_RECOVERY_AUDIT.md (Section: Inventory).

2) Running stack sanity:
   - Provide commands and results:
     - docker ps
     - docker logs --tail=200 {BACKEND_CONTAINER}
     - docker logs --tail=200 {DB_CONTAINER}
   - Verify there are no repeating crash loops.
   - Note any warnings (static duplicates etc) but don't fix unless they impact behavior.

PHASE 2 — BACKEND: TEST HYGIENE + CRITICAL FLOWS
Goal: make backend tests green and admin stable.

1) Fix known/likely test issues:
   - Search for import conflicts (e.g., core/tests.py naming or package collision).
   - Fix them properly (rename files, update imports, split modules) so discovery works.

2) Run backend tests:
   - Run the full suite and capture output in docs/verification/BACKEND_TEST_RESULTS.md.
   - If tests fail:
     - Fix failures from highest leverage to lowest.
     - Add missing fixtures where needed.

3) Add minimal regression tests if absent:
   - Admin changelist load test for Program (superuser) returns 200.
   - API CRUD smoke for:
     - Program create returns 201
     - Student create returns 201 (linked to Program)
     - Listing returns created records

4) Verify ORM does not trigger schema errors:
   - Run lightweight model queries for key models.
   - Ensure Postgres logs show no "column does not exist".

PHASE 3 — BACKEND: API MAP + CRUD MATRIX CONFIRMATION
Goal: ensure backend provides stable API contract.

1) Build or update docs/api/API_MAP.md (if it exists) or create it if not.
   - Enumerate resources, endpoints, auth required, expected payload fields.

2) Update docs/verification/BACKEND_CRUD_MATRIX.md:
   - For each canonical resource (Programs, Periods, Tracks, Blocks, Modules, Students):
     - list endpoint works (200)
     - create works (201)
     - update works (200/204)
     - delete works if supported
   - Use real API calls from repo's client or curl examples.

PHASE 4 — FRONTEND: COMPLETE ACADEMICS HIERARCHY UI
Goal: Frontend screens exist and work for Academics hierarchy.

1) Generate/update a Frontend Coverage Matrix:
   - docs/verification/FRONTEND_COVERAGE_MATRIX.md
   - For each resource: list/create/edit/detail implemented? yes/no.

2) Implement missing pages and routing:
   - Programs (confirm already exists)
   - Periods
   - Tracks
   - Blocks
   - Modules

3) For each page:
   - List view with table (pagination if standard)
   - Create form
   - Edit form
   - Detail view
   - Delete (if allowed)
   - Proper loading/empty/error states
   - Validation error display using backend 400 payloads

4) API wiring:
   - Ensure frontend uses a single API client with correct base URL.
   - Confirm no localhost hardcoding.
   - Confirm auth headers consistent.

5) Legacy modules:
   - Ensure nav does not show legacy modules unless explicitly enabled by config.
   - Document how toggles work in docs/diagnostics/POST_RECOVERY_AUDIT.md.

PHASE 5 — E2E TESTING (PLAYWRIGHT PREFERRED)
Goal: real regression coverage.

1) If repo already has Playwright/Cypress, use it. If none:
   - Add Playwright with minimal config.
   - Place tests under e2e/ (or playwright/tests).

2) Required E2E scenarios:
   - Login (admin or staff)
   - Navigate to Academics → Programs
   - Create Program
   - Create Period (linked to Program)
   - Create Track (linked)
   - Create Block (linked)
   - Create Module (linked)
   - Reload and confirm persistence
   - Ensure no 500s and no console errors

3) E2E rules:
   - No arbitrary sleeps; use auto-wait and explicit locators.
   - Fail on console errors and network 500 responses.
   - Store screenshots/videos on failure if configured.

4) Write results:
   - docs/verification/E2E_TEST_RESULTS.md
   - Include command used and summary.

PHASE 6 — SMOKE TEST SCRIPT (OPS SAFETY)
Goal: one-command check before/after deploy.

1) Create scripts/smoke_test.sh (or .py):
   - Check backend is reachable
   - Hit key endpoints:
     - /admin/ (200/302)
     - /api/academics/programs (200)
     - /api/students (200)
   - Optionally do a create/delete cycle in a safe way (or only in dev mode)
   - Exit non-zero on any failure

2) Document usage in docs/verification/VERIFICATION_PLAYBOOK.md.

PHASE 7 — FINAL PLAYBOOK + REPORT + COMMITS
1) docs/verification/VERIFICATION_PLAYBOOK.md:
   - Step-by-step manual verification:
     - Admin program page loads
     - Create Program/Student in UI
     - Academics hierarchy CRUD in UI
     - Logs clean
     - Tests pass
     - E2E pass
     - Smoke test pass

2) docs/reports/FINAL_SYSTEM_STATUS.md:
   - What's fixed
   - What's verified
   - What remains (if any)
   - How to re-verify quickly

3) Commit strategy (must follow):
   - test: fix discovery/import conflicts
   - test: add regression CRUD/admin tests
   - feat(ui): academics periods/tracks/blocks/modules pages + API wiring
   - test(e2e): add Playwright suite
   - chore: smoke test script
   - docs: playbook + final status report + matrices

FINAL TODO CHECKLIST (must append to FINAL_SYSTEM_STATUS.md)
- [ ] Backend tests pass
- [ ] Admin Program/Student pages load without 500
- [ ] No "column/relation does not exist" in DB logs during CRUD
- [ ] API CRUD matrix complete and passing for Academics + Students
- [ ] Frontend coverage matrix 100% for Programs/Periods/Tracks/Blocks/Modules
- [ ] All new frontend pages wired to correct API endpoints
- [ ] E2E tests implemented and passing
- [ ] Smoke test script implemented and passing
- [ ] Verification playbook finalized
- [ ] Final status report finalized
"""

def main() -> None:
    print(PROMPT.strip())

if __name__ == "__main__":
    main()
