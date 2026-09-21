# Frontend-Backend Verification Report (Phase E)

## 1. Contract/API Alignment

### Findings
- Frontend canonical auth usage is aligned:
  - Uses `POST /api/auth/login/` with `{ identifier, password }`.
  - Uses `GET /api/auth/me/`.
  - Uses `GET /api/dashboard/stats/`.
- Deprecated `/api/auth/token` is not used in active frontend auth flow.

### Result
- **Working perfectly:** canonical auth/dashboard endpoint usage.

## 2. RBAC / Permission Validation

### Executed checks
- `pilot_admin` login: success.
- `pilot_student` login: success.
- `/api/auth/me/` with both tokens: HTTP 200.
- `/api/admin/users/`:
  - admin token: HTTP 200
  - student token: HTTP 403 (expected deny)

### Result
- **Working perfectly:** auth identity checks and admin endpoint access control.

## 3. Core Workflow Verification

### Auth/Login
- `POST /api/auth/login/` works with canonical payload and baseline accounts.
- **Classification:** WORKING PERFECTLY

### User setup / onboarding
- Minimal role accounts are created and usable for login.
- **Classification:** WORKING PERFECTLY

### Dashboard loading
- `GET /api/dashboard/stats/` returns HTTP 200.
- Admin receives numeric zeroed baseline stats; student gets “no student record linked” response (truthful to clean baseline).
- **Classification:** WORKING BUT NEEDS DEBUGGING (student experience blocked without linked student record setup flow)

### Leave flow
- No active leave API routes found; probes return 404.
- **Classification:** NOT DONE / MISLEADING / HIDDEN

### Rotations / postings
- No active rotation/posting API routes found; probes return 404.
- **Classification:** NOT DONE / MISLEADING / HIDDEN

## 4. UI Truth Verification

### Findings
- Active docs now mark old verification/runtime-report packs as historical/non-authoritative.
- Legacy evidence screenshots/log outputs were removed from active truth surface.
- Leave/rotation/posting are not surfaced as implemented workflows in current backend API.

### Result
- **Working but needs debugging:** readiness truth in health endpoint still degraded due migration-check bug.

## 5. Build/Test Verification

### Backend
- `ruff check .` → **failed** (existing lint debt, many violations including in `verify_tables.py`).
- `pytest -q` → **passed**.

### Frontend
- `npm run lint` → **passed**
- `npm run type-check` → **passed**
- `npm run test` → **passed**
- `npm run build` → **passed**
- `npm run e2e:smoke` → **failed** (global setup expects old admin credentials/data not present in clean baseline).

## Verification Conclusion
- Core auth/RBAC contracts are valid on clean baseline.
- Build and unit-level checks are mostly healthy.
- Health readiness migration check and E2E smoke bootstrap assumptions require debugging for full trust automation.
