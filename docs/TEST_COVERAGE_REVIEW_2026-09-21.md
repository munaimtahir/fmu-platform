# App test coverage review — 21 September 2026

The repository now has repeatable line and branch measurement for backend, web, and Android. The current measurements are below the requested 95% per-area floor, so the contract reports the remaining gaps instead of treating aggregate coverage as sufficient.

This is a review of the working tree based on `ff42981`, including substantial pre-existing uncommitted work. Concurrent edits were observed during execution, including changes to onboarding tests. Results describe the code exercised during these runs, not a reproducible immutable commit; comparisons between runs are indicative. No application or test fixes were made for this review.

**Execution results**

| Layer / command scope | Result | Coverage interpretation |
|---|---|---|
| Backend default discovery (`tests`) | **421 passed**, 77 warnings | **72.2% application line coverage** after the scope correction below; branches not measured |
| Backend expanded discovery (`tests sims_backend core`, including `tests.py`) | **738 passed**, 119 warnings | **83.5% measured lines (7,616/9,118), 64.4% branches (1,381/2,146)**; the per-area 95% contract remains failing |
| Legacy intake tests | Collection blocked | Django model/application namespace error; excluded from active application totals |
| Web Vitest | **278 passed across 35 files** | **15.4% statements (1,132/7,341), 13.9% branches (760/5,465)**; per-area reporting is enabled and exposes untested pages/services |
| Standard Playwright `full` project | **104 tests discovered in 14 files** | Discovery only; full deployed-stack suite not executed |
| Isolated onboarding Playwright | **1 failed** | Reached password reset; ambiguous locator matched two password fields |
| Android unit tests | **33 passed** | JaCoCo report task is configured; emulator/instrumented coverage still requires an Android runner |
| Android instrumented tests | Not executed locally | 21 `@Test` annotations across 8 test files; CI task combines unit and connected-test execution |

**Backend component coverage**

These totals include `sims_backend` and `core`, including active student imports. They exclude legacy `apps/intake`, `tests.py`, and `conftest.py`. The repository's active `.coveragerc` also excludes migration files, management commands, test directories and `test_*.py`. Admin/configuration code remains included; this is not exactly the older policy-defined denominator. Percentages measure executed statements and branches, not assertion quality or requirements completeness.

| Backend component | Default lines | Expanded lines | Expanded branches | Expanded missed lines |
|---|---:|---:|---:|---:|
| academics | 66.1% | 81.7% | 67.8% | 146 |
| admin | 60.9% | 74.5% | 42.9% | 96 |
| attendance | 74.4% | 86.0% | 74.6% | 94 |
| audit | 84.0% | 84.0% | 65.2% | 33 |
| common | 57.1% | 57.1% | 30.0% | 6 |
| compliance | 71.4% | 78.1% | 33.7% | 84 |
| core | 77.3% | 81.3% | 54.0% | 197 |
| exams | 80.4% | 81.6% | 52.9% | 47 |
| faculty | 64.2% | 64.2% | 36.8% | 161 |
| finance | 73.8% | 82.2% | 62.0% | 203 |
| learning | 82.1% | 82.9% | 59.0% | 67 |
| mobile | 68.5% | 99.2% | 90.0% | 1 |
| notifications | 84.3% | 87.0% | 61.1% | 49 |
| people | 77.8% | 87.3% | 60.7% | 40 |
| project configuration | 77.0% | 77.0% | 29.2% | 53 |
| results | 89.3% | 90.0% | 66.7% | 45 |
| settings_app | 48.8% | 78.7% | 42.3% | 27 |
| students | 53.1% | 67.8% | 30.2% | 332 |
| syllabus | 64.0% | 80.7% | 28.6% | 22 |
| timetable | 85.6% | 88.1% | 66.1% | 46 |
| transcripts | 72.2% | 72.2% | 56.7% | 49 |

The raw reports differ from the corrected application totals: the default audit added `--cov=apps` and reports 68.8% (6,632/9,633); selecting only the configured `sims_backend` and `core` sources gives 70.2%, before removing test infrastructure. The expanded raw report gives 79.0% lines and 51.8% branches including legacy intake and test infrastructure. Its terminal **74%** is a combined line/branch metric, not line coverage. The expanded suite is not green, so its higher execution coverage must not be interpreted as a verified passing baseline.

**Findings, in priority order**

1. **Default backend discovery hides failing tests.** `backend/pytest.ini:13` restricts discovery to `tests`, while its filename pattern omits `tests.py`. CI also explicitly runs `pytest tests`. Expanding discovery produced 175 additional collected outcomes, including some duplicated/imported test cases; this is not 175 distinct new behaviors. Three workflow tests fail while creating an existing `ADMIN` group (`UNIQUE constraint failed: auth_group.name`). Nine permission-test setups fail with missing `api_client`; the trace resolves to definitions in `backend/tests/test_permissions.py` while collected under the app-local attendance module, indicating fixture/import discovery problems. `core/tests/test_seed_demo_scenarios.py::test_low_attendance_bucket` fails because observed attendance is 100% against an expectation below 85%; the test itself acknowledges randomness. See the expanded JUnit/log artifacts for the exact run.
2. **Coverage settings and CI do not enforce the documented contract.** `coverage debug config` in `backend` confirms `branch=False`, `fail_under=0.0`, and `.coveragerc` as the active configuration. The `[coverage:run]` section in `pytest.ini` is not consumed. Its declared exclusions therefore do not apply, and some test infrastructure enters the denominator. CI adds `--cov=.`, changing scope again. All backend, frontend, E2E and Android workflows are currently `workflow_dispatch` only; neither PR nor scheduled runs are enabled. The existing `docs/_coverage/00_COVERAGE_CONTRACT.md` targets 100% lines and branches, but the current setup does not enforce either.
3. **Critical branch coverage remains low.** Students are 30.2%, compliance 33.7%, faculty 36.8%, and admin APIs 42.9%. Prioritize authorization denials, invalid input, rollback/idempotency, document handling and import failure paths. Large remaining gaps include faculty import services (132 missed lines), finance views (114), student views (91), academic views (87), student import services (65), and compliance views (55).
4. **Onboarding browser coverage is separate and currently fails.** `frontend/playwright.onboarding.config.ts` runs an isolated disposable backend/database, but standard package scripts and CI do not select it. The executed workflow passed earlier import/profile/document assertions, then `getByLabel('Temporary password')` matched both password fields. Reset completion and subsequent assertions were not verified. Concurrent edits moved source lines, so use the retained run report/trace rather than a current line number.
5. **Web tests cover selected components, with broad workflow gaps.** There are no dedicated unit files for most finance pages, academic CRUD, people CRUD, timetable editors, compliance administration, student-detail/correction flows or the mandatory-password-change page. Some receive indirect or browser coverage, so this is not a claim of zero executed lines. Finance's form test only checks required fields; its two role E2E tests check dashboard landing and fee-type/create-control visibility rather than a completed financial transaction.
6. **Some browser checks can conceal missing functionality.** `frontend/e2e/tests/admin/admin.spec.ts` skips search/create tests when the controls are absent. Several role tests check headings, navigation and available controls rather than completed business state changes. The 104 discovered tests are not evidence of 104 passing workflows.
7. **Legacy scope documentation needs reconciliation.** The older policy explicitly excludes `apps/intake` and student imports as inactive. Intake is reported separately here; its pytest collection raises `intake.models.StudentIntakeSubmission ... isn't in an application in INSTALLED_APPS`. Student imports are now part of active onboarding and are included here. Top-level `modules/*` directories contain placeholder READMEs rather than independent implemented applications.

**Web component inventory**

All counts below are passing tests from this review, not code-coverage percentages. Some tests exercise multiple components.

| Area | Test files | Tests | Main coverage / limitation |
|---|---:|---:|---|
| Shared UI/layout | 5 | 30 | Button, Input, ConfirmDialog, Can and Sidebar; 40 production files in `components` |
| Authentication | 4 | 50 | Login, ProtectedRoute, auth store and access rules |
| Finance form | 1 | 1 | Voucher required-field validation |
| Pages/dashboards | 8 | 37 | Dashboard routing/statistics, notifications admin, attendance input, learning and student onboarding; 86 production TS/TSX files under `pages` |
| Services | 4 | 22 | Attendance, results, transcripts and notifications admin; 28 production service files |
| HTTP client | 1 | 6 | Axios client behavior |
| Utilities, libraries and route configuration | 5 | 40 | API errors, download, multipart, attendance utility, route access |
| Workflow contract smoke | 1 | 2 | Role landing routes and explicit access-rule presence |

## Coverage hardening update

The subsequent implementation pass added a per-area coverage manifest and verifier at `coverage/areas.json` and `scripts/check_coverage.py`, with a mandatory floor of 95% and a preferred floor of 99% for lines and branches. The verifier rejects missing files, overlapping assignments, missing branch data, and an area below the floor even when the aggregate average is high. The latest machine-readable outputs are `coverage/backend-areas.json` and `coverage/web-areas.json`.

The backend discovery and configuration are now unified and branch-aware. The full backend suite passes **738 tests** and currently measures **83.5% lines and 64.4% branches** across the active configured source set, so the 95% gate correctly remains failing. Syllabus now exceeds 95% lines, while compliance improved to 91.9% lines after adding validation, upload, review, and assignment-path coverage. New coverage tests cover workflow role matrices, API contracts, media URL safety, pagination, authentication, administrative services and shared hooks.

The web suite now passes **278 tests across 35 files**, with V8 coverage reports enabled. The measured web source total is currently **15.4% statements and 13.9% branches**, because most page and service modules have no direct tests; the verifier exposes those gaps rather than hiding them behind the aggregate. Android local unit tests pass **33 tests**, and the build now defines a combined JaCoCo report task for unit plus emulator execution. Emulator coverage still requires the CI Android runner.

The two student-onboarding unit tests cover initial-load retry and independent section saves. They do not replace the complete browser acceptance workflow. The full per-file passing inventory is appended below.

**Browser and Android inventory**

Standard browser discovery: admin 18; auth 10; coordinator 2; exam cell 8; faculty 17; finance 2; office 2; public 4; RBAC 8; registrar 10; smoke 7; student 16. Total: 104. The separate onboarding workflow adds one test outside that configuration. Chromium is the configured desktop browser; this does not establish Firefox/Safari coverage.

Android contains 33 unit-test annotations across 11 files covering role/error normalization, navigation/staff catalogs, API contracts/repository behavior and attendance, faculty, home, profile, results and timetable view models. There are 21 instrumented-test annotations covering login, shell, home, results, attendance, faculty, student services and staff screens. Three additional instrumented-source files are support code, not test suites. No JaCoCo/Kover coverage setup was found. The offline dependency failure is an environment limitation, not an observed Android assertion failure.

**Recommended next steps**

1. Make backend discovery explicit and repair fixture/import collisions, duplicate-group setup and the nondeterministic attendance test before adopting an expanded passing baseline.
2. Consolidate backend coverage configuration in `.coveragerc`, enable branch measurement, exclude all test infrastructure, reconcile active scope, and enforce an agreed threshold in CI. Enable PR/scheduled triggers as appropriate.
3. Repair the onboarding locator and include the isolated workflow in CI. Add completed workflows for financial transactions, result publication/correction, compliance decisions and imports, including rejection/failure paths.
4. Configure Vitest coverage and Android coverage reporting so those layers can have honest component-level line/branch baselines.
5. Add a PostgreSQL/migration and Redis/RQ integration lane. Current backend tests use in-memory SQLite, local-memory cache, mostly disabled migrations, fast password hashing and disabled default DRF throttles; their results do not establish production database/queue behavior.

**Reproduction and evidence**

Run from `backend`, with `DJANGO_SECRET_KEY=test-review-only APP_VERSION=test DJANGO_DEBUG=False` and separate `COVERAGE_FILE` paths:

```bash
# Default test discovery, broader audit measurement scope
.venv/bin/python -m pytest -o addopts='' \
  --cov=sims_backend --cov=core --cov=apps \
  --cov-report=json:/tmp/fmu-coverage-review/backend-default.json \
  --cov-report=term --junitxml=/tmp/fmu-coverage-review/backend-default.xml -q

# Expanded discovery and explicit branch measurement
.venv/bin/python -m pytest tests sims_backend core -o addopts='' \
  --import-mode=importlib -o 'python_files=test_*.py *_test.py tests.py' \
  --cov=sims_backend --cov=core --cov=apps --cov-branch \
  --cov-report=json:/tmp/fmu-coverage-review/backend-expanded.json \
  --cov-report=term --junitxml=/tmp/fmu-coverage-review/backend-expanded.xml -q

# Separate legacy collection check
.venv/bin/python -m pytest apps/intake/tests --import-mode=importlib --no-cov -q
```

The default audit clears addopts to control reports and therefore uses pytest's default import mode; the expanded run explicitly restores the project's importlib mode to avoid name collisions. Both use the repository's test settings.

From `frontend`: `npm test -- --reporter=json --outputFile=/tmp/fmu-coverage-review/frontend-unit.json`; `npx playwright test --project=full --list --reporter=json`; and `npx playwright test --config=playwright.onboarding.config.ts --reporter=json --output=/tmp/fmu-coverage-review/onboarding-artifacts`. From `android`: `bash gradlew :app:testDebugUnitTest --offline --console=plain`.

Raw coverage JSON, JUnit XML, browser reports/trace and command logs are retained in `/tmp/fmu-coverage-review/` (temporary local artifacts). Existing backend `.coverage` and HTML reports were not used as evidence or overwritten. The fresh runs are the basis of this report.

**Web test-file results**

| Web test file | Tests | Result |
|---|---:|---|
| `src/workflowSmoke.test.tsx` | 2 | Passed |
| `src/api/axios.test.ts` | 6 | Passed |
| `src/config/routeAccess.test.ts` | 10 | Passed |
| `src/lib/apiErrors.test.ts` | 9 | Passed |
| `src/lib/download.test.ts` | 8 | Passed |
| `src/lib/multipart.test.ts` | 4 | Passed |
| `src/pages/DashboardHome.test.tsx` | 10 | Passed |
| `src/services/attendance.test.ts` | 6 | Passed |
| `src/services/notificationsAdmin.test.ts` | 12 | Passed |
| `src/services/results.test.ts` | 3 | Passed |
| `src/services/transcripts.test.ts` | 1 | Passed |
| `src/utils/attendance.test.ts` | 9 | Passed |
| `src/components/layout/Sidebar.test.tsx` | 8 | Passed |
| `src/components/shared/Can.test.tsx` | 4 | Passed |
| `src/components/shared/ConfirmDialog.test.tsx` | 5 | Passed |
| `src/components/ui/Button.test.tsx` | 7 | Passed |
| `src/components/ui/Input.test.tsx` | 6 | Passed |
| `src/features/auth/LoginPage.test.tsx` | 6 | Passed |
| `src/features/auth/ProtectedRoute.test.tsx` | 7 | Passed |
| `src/features/auth/access.test.ts` | 29 | Passed |
| `src/features/auth/authStore.test.ts` | 8 | Passed |
| `src/features/finance/VoucherGenerationForm.test.tsx` | 1 | Passed |
| `src/pages/admin/NotificationAdminPage.test.tsx` | 10 | Passed |
| `src/pages/attendance/AttendanceInputPage.test.tsx` | 2 | Passed |
| `src/pages/dashboards/AdminDashboard.test.tsx` | 1 | Passed |
| `src/pages/dashboards/StatsDashboards.test.tsx` | 9 | Passed |
| `src/pages/learning/LearningFeedPage.test.tsx` | 2 | Passed |
| `src/pages/learning/LearningMaterialsPage.test.tsx` | 1 | Passed |
| `src/pages/students/StudentOnboardingPage.test.tsx` | 2 | Passed |
