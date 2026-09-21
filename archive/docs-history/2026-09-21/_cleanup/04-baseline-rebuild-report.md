# Trusted Baseline Rebuild Report (Phase D)

## Status
**Completed with issues** — clean rebuild succeeded; one readiness check is degraded.

## Rebuild Actions
1. Rebuilt and restarted stack from clean runtime state:
   - `docker compose up -d --build backend frontend` (with db/redis already reset in Phase B)
2. Confirmed service runtime:
   - `fmu_backend` running
   - `fmu_frontend` running
   - `fmu_db` running
   - `fmu_redis` healthy
3. Verified canonical login endpoint against baseline account:
   - `POST /api/auth/login/` with `identifier + password` returns user and JWT tokens.

## Clean Startup Findings
- `GET /api/health/` returns HTTP 200 but reports `status: "degraded"`.
- Degradation source:
  - migration readiness check error: `unsupported operand type(s) for -: 'list' and 'dict'`.
- DB and Redis checks are healthy.

## Baseline Accounts Present
- Minimal role accounts intentionally recreated:
  - `pilot_admin`
  - `pilot_registrar`
  - `pilot_examcell`
  - `pilot_coordinator`
  - `pilot_faculty`
  - `pilot_finance`
  - `pilot_student`
  - `pilot_office`

## Outcome
- Trusted clean baseline is rebuildable and starts without old demo data dependency.
- Readiness endpoint migration-check logic needs debugging before claiming fully healthy startup.
