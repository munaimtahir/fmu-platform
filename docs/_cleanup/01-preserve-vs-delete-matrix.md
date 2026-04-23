# Preserve vs Delete Matrix (Phase A)

## Final Matrix

| Category | Action | Rationale | Concrete Targets |
|---|---|---|---|
| Migrations & schema history | **PRESERVE** | Required for deterministic rebuild and auditability | `backend/**/migrations/*.py` |
| Core model code and permissions structure | **PRESERVE** | Defines canonical system behavior and RBAC contract | `backend/core/**`, `backend/sims_backend/**` (excluding runtime artifacts) |
| Reference/master data definitions | **PRESERVE** | Needed for pilot baseline integrity | Role group definitions, canonical lookup/reference models |
| Required bootstrap config | **PRESERVE** | Needed to run system safely and consistently | `.env`, `.env.example`, compose files, CI workflows, contracts/docs authority files |
| Canonical docs | **PRESERVE (truth-correct as needed)** | Keep documentation, remove false claims only | `docs/**` except stale evidence/debug artifacts listed below |
| Test/demo transactional DB records | **DELETE** | Clutter and truth distortion | Demo users/students/workflow records (or full DB volume reset) |
| Fake/demo accounts | **DELETE** | Prevent pilot contamination | Accounts with demo naming/patterns (e.g., `demo_%`, `DEMO_%`) |
| Demo workflow data | **DELETE** | Must not remain in trusted baseline | Demo attendance/results/vouchers/sessions tied to demo records |
| Runtime uploads/media tied to test/demo | **DELETE** | Reset runtime state | `backend/media/**` demo/test outputs |
| Temporary screenshots/evidence artifacts | **DELETE or ARCHIVE OUTSIDE ACTIVE SURFACE** | Not authoritative runtime truth | `docs/verification/artifacts/**`, `docs/admin-runtime-report/screenshots/**`, top-level `e2e-results.json`, `frontend/e2e-results.json`, `frontend/playwright-report/**`, `frontend/test-results/**` |
| Stale local caches/build outputs | **DELETE** | Prevent hidden state coupling | `backend/staticfiles/**`, `frontend/dist/**`, local cache/runtime leftovers |
| Redundant demo fixtures/seed usage for production truth | **DELETE/HIDE FROM ACTIVE CLAIMS** | Avoid implying demo state is baseline | Demo seed docs/scripts references from active docs surface |
| Audit logs | **PRESERVE CONDITIONALLY** | Keep if compliance requires; otherwise safe reset for clean baseline | `audit_auditlog` table/data |
| Notification logs | **PRESERVE CONDITIONALLY** | Keep if operationally required; otherwise reset | notification/event logs |
| Evidence folders | **PRESERVE CONDITIONALLY / ARCHIVE** | Keep if still authoritative, else archive/remove from active docs | `docs/verification/*`, `docs/admin-runtime-report/*` |
| Sample demo data | **PRESERVE CONDITIONALLY** | Keep only if explicitly needed for demos; excluded from pilot truth baseline | Demo seed outputs and generated credentials |

## Conditional Decisions Applied in This Sprint
- **Audit logs:** reset with DB baseline rebuild (pilot clean-state priority).
- **Notification logs:** reset with DB baseline rebuild.
- **Evidence packs/screenshots:** remove from active authoritative surface; retain only if clearly archived and non-authoritative.
- **Sample demo data:** removed from runtime baseline; demo commands may remain as non-default tooling but must not be represented as active baseline state.
