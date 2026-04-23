# Open Issues

## Admissions/Application API Contract Missing

- Severity: High
- Why not fixed now: There is no mounted DRF API for the FE application submit/review paths. Implementing admissions submit/review is a feature/API definition task, not a stabilization patch.
- Next action: Define and implement canonical admissions endpoints or remove the inactive FE API assumptions from the public application page.

## Backend Full Ruff Debt

- Severity: Medium
- Why not fixed now: `ruff check .` reports 963 preexisting errors across migrations, management commands, tests, and utility scripts. Mass-fixing them would exceed the targeted stabilization scope.
- Next action: Add a scoped lint baseline or staged lint cleanup plan. Keep touched-file lint green meanwhile.

## Health Endpoint Migrations Check Degraded

- Severity: Medium
- Why not fixed now: The backend returns HTTP 200, but `/api/health/` reports migrations degraded due `unsupported operand type(s) for -: 'list' and 'dict'`.
- Next action: Fix the migrations health-check implementation and add a focused health endpoint regression test.

## Admissions Public Page Is Only Load-Tested

- Severity: Medium
- Why not fixed now: Public `/apply` loads without auth, but no backend submit contract exists to exercise.
- Next action: Add submit/review E2E only after the backend API is canonical.

## Build Warnings Remain

- Severity: Low
- Why not fixed now: Vite reports a large JS chunk and stale Browserslist data. These do not block integration correctness.
- Next action: Update Browserslist data and consider route-level code splitting separately.
