# FMU SIMS — Playwright E2E Test Suite

## Overview

This document describes the Playwright end-to-end test suite for FMU SIMS. The suite covers all five user roles, key business workflows, RBAC enforcement, and public verification flows.

---

## Directory Structure

```
frontend/e2e/
├── auth/
│   └── .auth/                  # Generated auth storage states (gitignored)
│       ├── admin.json
│       ├── registrar.json
│       ├── faculty.json
│       ├── student.json
│       └── examcell.json
├── data/
│   └── test-data.ts            # Test users, routes, seed constants
├── fixtures/
│   └── auth.ts                 # Role-based authenticated page fixtures
├── helpers/
│   ├── api.ts                  # API-backed setup helpers
│   ├── assertions.ts           # Custom assertion helpers (toast, badge, table)
│   └── navigation.ts           # Navigation helpers
├── pages/                      # Lightweight Page Object Models
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── StudentsPage.ts
│   ├── AttendancePage.ts
│   ├── ResultsPage.ts
│   ├── TranscriptVerifyPage.ts
│   └── AuditPage.ts
├── tests/
│   ├── smoke/smoke.spec.ts     # 7 smoke tests
│   ├── auth/auth.spec.ts       # 10 auth/session tests
│   ├── admin/admin.spec.ts     # 16 admin role tests
│   ├── registrar/registrar.spec.ts  # 10 registrar tests
│   ├── faculty/faculty.spec.ts # 12 faculty tests
│   ├── student/student.spec.ts # 10 student tests
│   ├── examcell/examcell.spec.ts # 8 exam cell tests
│   ├── public/public.spec.ts   # 4 public verify tests
│   └── rbac/rbac.spec.ts       # 8 RBAC / state-machine tests
└── global.setup.ts             # Auth state generation (runs before all tests)
```

---

## Prerequisites

1. **Backend running** at `http://localhost:8010` (or set `API_BASE_URL`)
2. **Frontend running** at `http://localhost:5173` (or `http://localhost:8080` for docker)
3. **Demo data seeded** (see below)
4. Node.js 20+, npm

---

## Required Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | Frontend URL |
| `PLAYWRIGHT_BASE_URL` | same | Alternative frontend URL |
| `API_BASE_URL` | `http://localhost:8010` | Backend API URL (for global setup) |

Create a `frontend/.env.test` file (not committed):
```bash
BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:8010
```

---

## Test Users (Created by Seed Commands)

| Role | Username | Password | Created by |
|------|----------|----------|------------|
| Admin | `admin` | `admin123` | `seed_demo` |
| Registrar | `registrar` | `registrar123` | `seed_demo` |
| Faculty | `faculty` | `faculty123` | `seed_demo` |
| Student | `student` | `student123` | `seed_demo` |
| ExamCell | `examcell` | `examcell123` | `global.setup.ts` or manual |

---

## How to Seed Data

### Option 1: Full demo seed (recommended)
```bash
cd backend
python manage.py seed_demo --students 20
```

### Option 2: Scenario-based seed
```bash
python manage.py seed_demo_scenarios --students 20 --program MBBS --term Block-1 --sections 3
```

### Create ExamCell user manually (if not seeded)
```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
U = get_user_model()
if not U.objects.filter(username='examcell').exists():
    u = U.objects.create_user(username='examcell', email='examcell@sims.edu', password='examcell123')
    g, _ = Group.objects.get_or_create(name='ExamCell')
    u.groups.add(g)
    print('Created')
else:
    print('Already exists')
"
```

---

## How to Run Locally

### Install dependencies (once)
```bash
cd frontend
npm install
npx playwright install --with-deps chromium
```

### Run smoke suite (fast, ~2 min)
```bash
cd frontend
npm run e2e:smoke
```

### Run full suite
```bash
npm run e2e:full
```

### Run by role
```bash
npm run e2e:admin
npm run e2e:registrar
npm run e2e:faculty
npm run e2e:student
npm run e2e:examcell
```

### Run auth/public tests
```bash
npm run e2e:auth
npm run e2e:public
npm run e2e:rbac
```

### Interactive UI mode
```bash
npm run e2e:ui
```

### Headed mode (see browser)
```bash
npm run e2e:headed
```

### Debug mode (step-through)
```bash
npm run e2e:debug
```

### Open HTML report after run
```bash
npm run e2e:report
```

---

## How to Regenerate Auth States

Auth states are generated automatically by `global.setup.ts` when you run any test.
To regenerate manually:
```bash
cd frontend
npx playwright test --project=smoke  # This triggers global.setup.ts
# Or run global setup directly (not a standard Playwright command)
```

Auth state files are stored in `frontend/e2e/auth/.auth/` and are **gitignored** since they contain session tokens.

---

## Test Suite Summary

| Suite | Project | Count | Description |
|-------|---------|-------|-------------|
| Smoke | `smoke` | 7 | Fast CI gate: login, key pages, public verify, route guard |
| Auth/Session | `auth` | 10 | Login/logout, session persistence, role blocks |
| Admin | `admin` | 16 | Students CRUD, academics, audit, system pages |
| Registrar | `registrar` | 10 | Enrollment, eligibility, forbidden routes |
| Faculty | `faculty` | 12 | Attendance, gradebook, marks, forbidden routes |
| Student | `student` | 10 | Own data access, RBAC negatives |
| Exam Cell | `examcell` | 8 | Publish/freeze results, transcripts |
| Public | `public` | 4 | Transcript verify (no auth), apply page |
| RBAC | `rbac` | 8 | Negative RBAC, state machine workflows |
| **Total** | | **~85** | |

---

## CI Integration

The suite is wired into `.github/workflows/e2e.yml`:

| Trigger | Suite run |
|---------|-----------|
| Pull Request to `main`/`develop` | `smoke` project only |
| `workflow_dispatch` | Configurable (smoke/full/role) |
| Nightly schedule (02:00 UTC) | `full` project |

### Artifacts uploaded after each run:
- `playwright-report-*` — HTML report (14 days retention)
- `e2e-results-*` — JSON results
- `playwright-artifacts-*` — Screenshots, traces, videos (on failure only)

---

## Known Gaps / Deferred Tests

1. **Token refresh flow** — Not tested directly; would require intercepting refresh API calls
2. **File upload** — Students import page (`/system/students/import`) not covered
3. **Timetable** — UI page exists but no structured workflow tests yet
4. **Finance deep tests** — Finance workflows (vouchers, payments) scaffolded but not detailed
5. **Request workflow** — Requests module noted as "legacy removed" in routes; tests will skip if UI not present
6. **ExamCell user** — Not in default seed; created via `global.setup.ts` using admin API; may fail if API endpoint for user creation is not available (test will warn)

---

## Extending the Suite

1. Add new spec files in the appropriate `tests/<role>/` directory
2. Use `test` from `../../fixtures/auth` for pre-authenticated tests
3. Add page objects in `pages/` for new UI areas
4. Add test data constants to `data/test-data.ts`
5. Use `@playwright/test`'s `test.skip(condition, reason)` to skip unbuilt UI gracefully
