# Stabilization Change Log

## Results Publish / Freeze

- `frontend/src/services/results.ts`: aligned types, filters, and workflow actions to `/api/results/{id}/.../`.
- `frontend/src/pages/examcell/PublishResults.tsx`: replaced legacy section/collection workflow with result-header list and row-level publish/freeze.
- `frontend/src/pages/results/ResultsPage.tsx`, `frontend/src/pages/dashboards/AdminDashboard.tsx`: updated result fields and status filters.
- `backend/tests/regression/test_stabilization_contracts.py`, `frontend/src/services/results.test.ts`: added contract coverage.

## Transcript Verification

- `backend/sims_backend/transcripts/views.py`: made verification public and allowed Registrar administrative generation.
- `frontend/src/services/transcripts.ts`, `frontend/src/pages/verify/TranscriptVerify.tsx`: matched `{valid, student_id, reason}` response shape.
- `frontend/src/services/transcripts.test.ts`: added service contract coverage.

## RBAC / Permissions

- `backend/core/serializers.py`, `backend/sims_backend/admin/serializers.py`: fixed role precedence for Registrar/ExamCell before legacy Admin group fallback.
- `backend/sims_backend/common_permissions.py`, `backend/core/permissions.py`: made group checks case-insensitive, tightened Admin semantics, and added conservative built-in role fallback.
- `backend/sims_backend/results/views.py`, `backend/sims_backend/finance/views.py`: allowed student own-read paths while keeping staff access task-gated.
- `frontend/src/routes/appRoutes.tsx`, `frontend/src/config/navConfig.ts`: aligned transcript route policy.
- `frontend/e2e/tests/*`: updated RBAC expectations to canonical Access Denied UX.

## E2E Runtime

- `frontend/e2e/data/test-data.ts`: fixed auth state file paths and canonical admin email.
- `frontend/e2e/helpers/api.ts`: moved ExamCell setup to `/api/admin/users/`.
- `frontend/e2e/global.setup.ts`: removed empty auth-state fallback and now fails setup on login/setup errors.
- `docker-compose.yml`, `docker-compose.dev.yml`, `.github/workflows/e2e.yml`: normalized `DJANGO_SECURE_SSL_REDIRECT=False` and frontend API origin for proxy-based E2E.

## Quality / Runtime Blockers

- `backend/sims_backend/attendance/views.py`: restored session-access helper import and supported single-record mark payload.
- `backend/core/demo_scenarios.py`, `backend/core/management/commands/seed_demo_scenarios.py`, `backend/tests/test_demo_scenarios.py`: removed dead legacy finance cleanup, restored voucher scenario, and aligned demo marker assertions.
- `frontend/vite.config.ts`: restricted Vitest to `src/**/*.test.{ts,tsx}` and excluded E2E/report folders.
- `frontend/eslint.config.js`: ignored generated Playwright output.

## Legacy Isolation

- `frontend/src/pages/gradebook/Gradebook.tsx`: removed active calls to removed assessment-score endpoints.
