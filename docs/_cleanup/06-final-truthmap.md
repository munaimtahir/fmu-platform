# Final Truthmap

## Feature Classification (Active Surface)

| Feature | Classification | Evidence |
|---|---|---|
| Unified auth login (`/api/auth/login/`) | **WORKING PERFECTLY** | Login succeeds with baseline accounts and returns JWT tokens |
| Auth identity (`/api/auth/me/`) | **WORKING PERFECTLY** | Admin and student tokens return HTTP 200 |
| RBAC admin protection (`/api/admin/users/`) | **WORKING PERFECTLY** | Admin HTTP 200, student HTTP 403 |
| Dashboard API (`/api/dashboard/stats/`) | **WORKING BUT NEEDS DEBUGGING** | Admin gets baseline stats; student response indicates no linked student record in clean baseline |
| Health/readiness endpoint (`/api/health/`) | **WORKING BUT NEEDS DEBUGGING** | Returns HTTP 200 with degraded status due migration-check type error |
| Backend test suite (`pytest -q`) | **WORKING PERFECTLY** | Passes on clean baseline |
| Backend lint gate (`ruff check .`) | **WORKING BUT NEEDS DEBUGGING** | Fails due existing lint debt (not introduced by this sprint) |
| Frontend lint/type/unit/build | **WORKING PERFECTLY** | `lint`, `type-check`, `test`, `build` all pass |
| Frontend E2E smoke (`playwright --project=smoke`) | **WORKING BUT NEEDS DEBUGGING** | Fails due stale global setup credential/data assumptions |
| Leave workflow | **NOT DONE / MISLEADING / HIDDEN** | No active leave endpoints (404 probes) |
| Rotations workflow | **NOT DONE / MISLEADING / HIDDEN** | No active rotation endpoints (404 probes) |
| Postings workflow | **NOT DONE / MISLEADING / HIDDEN** | No active posting endpoints (404 probes) |

## Documentation Truth Status
- Previous “all complete / production ready” readmes in legacy verification/runtime-report locations were replaced with historical-status disclaimers.
- Active cleanup reports in `docs/_cleanup/` are the current authority.
