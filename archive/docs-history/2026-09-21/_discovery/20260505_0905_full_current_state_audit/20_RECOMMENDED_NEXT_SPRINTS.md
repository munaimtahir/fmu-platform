# 20. Recommended Next Sprints

**Date Executed**: Tue May 5 09:20 UTC 2026

## Sprint 0 — Stabilize Audit Blockers
**Goal**: Resolve the immediate P0/P1 blockers preventing a green test run and healthy environment.
**Tasks**:
- Apply the 21 pending database migrations inside the Docker container (`docker compose exec backend python manage.py migrate`).
- Investigate and resolve the 19 failing backend tests (focusing on `faculty_imports` and `wave2_business_logic`).
- Fix the single failing frontend test (`axios.test.ts`).
- Run `ruff check --fix .` and resolve the remaining styling errors.
**Commands to verify**:
- `curl -i http://localhost:8010/api/health/` (should show status: ok)
- `pytest` (should be 100% green)
- `npm test` (should be 100% green)

## Sprint 1 — Background Worker & Environment Validation
**Goal**: Ensure all required services for business operations are running.
**Tasks**:
- Add or fix the `rqworker` container in `docker-compose.yml`.
- Verify background job queues (like transcript generation) process correctly.
**Commands to verify**:
- `docker compose ps` (must list `rqworker`)

## Sprint 2 — E2E User Flow Completion
**Goal**: Run Playwright suite against the stabilized environment.
**Tasks**:
- Execute the E2E tests in `frontend/e2e/`.
- Document any failing flows and fix them.

## Sprint 3 — Documentation & Clean Up
**Goal**: Remove noise from the repository.
**Tasks**:
- Audit the `archive/` folder and either delete it or explicitly exclude it from developer/agent workflows via `.geminiignore`.