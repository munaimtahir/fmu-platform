# Verification Results

| Check | Before | After | Status | Notes |
|---|---|---|---|---|
| Backend dependency setup | System Python blocked package install; no local venv | `backend/.venv` created and requirements installed | Pass | Environment normalized for local backend checks. |
| Backend tests | Failed on finance own-ledger 403, stale `/api/sections/`, attendance import error, workflow crash, demo seed/reset issues | `pytest -q`: 73 passed | Pass | Warnings remain from DRF/reportlab/Decimal. |
| Backend targeted lint | Touched files had lint/runtime errors | Targeted `ruff check ...`: all checks passed | Pass | Full repo lint remains out of scope. |
| Backend full lint | Massive preexisting lint debt | `ruff check .`: 963 errors | Blocked | Documented open issue; not mass-fixed. |
| Frontend unit tests | Unit runner risked picking up E2E/report artifacts | `npm test -- --run`: 11 files, 49 tests passed | Pass | One existing React `act(...)` warning remains. |
| Frontend typecheck | Initially failed on legacy result filter usage | `npm run type-check`: passed | Pass | |
| Frontend lint | Initially failed on generated Playwright report files | `npm run lint`: passed | Pass | Generated reports excluded. |
| Frontend build | Needed confirmation after contract changes | `npm run build`: passed | Pass | Vite chunk-size and Browserslist age warnings remain. |
| Docker compose config | Needed validation after env changes | `docker compose config --quiet`: passed | Pass | |
| Docker runtime health | Backend redirected HTTP due SSL redirect | HTTP redirect fixed; `/api/health/` returns 200 degraded | Partial | Migrations check bug remains: unsupported `list - dict`. |
| Playwright public | Public transcript verify was auth-blocked before | `npm run e2e:public`: 4 passed | Pass | |
| Playwright ExamCell | Failed on publish/user setup/forbidden assumptions before | `npm run e2e:examcell`: 8 passed | Pass | |
| Playwright RBAC | Failed on stale forbidden assertions before | `npm run e2e:rbac`: 8 passed | Pass | |
| Playwright auth | Email/admin/logout/RBAC checks unstable before | `npm run e2e:auth`: 10 passed | Pass | |
| Playwright role suites | Faculty/Registrar/Student nav and forbidden assertions unstable before | Faculty 12 passed, Registrar 10 passed, Student 10 passed | Pass | |
| Playwright full alias | Previously 16 failures after harness fixes | `npm run e2e:full`: 85 passed | Pass | |
| CI workflow sanity | E2E workflow had stale API/proxy env assumptions | Workflow env updated; no full GitHub Actions run locally | Partial | Docker config validated locally. |
