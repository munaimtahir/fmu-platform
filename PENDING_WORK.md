# Vexel MedSIMS — Pending & Deferred Work

Status as of commit `60bc7e3` (2026-09-10 follow-up session: ops hardening, demo-account audit command, dashboard/table unification subset, and timetable e2e coverage landed on top of `ddfcf9f`, the "mega sprint" deploy to production `sims.vexel.pk`).

This document tracks what was **explicitly deferred** from the "mega sprint" spec (Timetable Foundation + Android Student Experience + Web UI Redesign) and what surfaced as **pending follow-up** during that sprint and this one. Use it as the starting brief for the next planning session — each item below has enough context to scope a plan without re-discovering the codebase from scratch.

---

## 1. Android — entire workstream deferred

Not started. `/android` exists in the repo with its own CI (`.github/workflows/android-ci.yml`) but was judged too large/risky a toolchain (Kotlin/Compose/Gradle, physical/emulator validation) to fold into the same sprint as backend+web work.

Scope when picked up (from the original spec):
- Student Academic Home (identity, programme/batch/period, attendance summary, latest results, today's schedule)
- Read-only Attendance screen
- Read-only Results screen (respect frozen/published visibility rules — do not regress the isolation fix in `ResultHeaderViewSet`)
- Timetable screen (Today/Week), consuming `GET /api/mobile/student/timetable/` — **this endpoint now exists and is live** (Mobile API Freeze 02, see §4)
- Navigation: Home / Timetable / Attendance / Results / Profile
- Full state hardening: loading/empty/error/offline/401/403/404/500/token-refresh/logout on every screen
- `./gradlew test/lint/assembleDebug/bundleRelease`, dedicated `sims` API-36 emulator acceptance
- Do NOT implement: attendance marking, result mutation, finance transactions, admin writes (mobile stays read-only)

**Starting point:** the backend contract it needs is already frozen and deployed — read `backend/sims_backend/mobile/views.py` (`StudentHomeView`, `StudentTimetableView`) and `backend/sims_backend/mobile/timetable_resolution.py` for the exact response shapes before writing any Kotlin models.

---

## 2. Web UI — full design-system rollout still not done

**Done this follow-up session** (see git log around commit `b714a85`/merge `60bc7e3`): `AdminDashboard.tsx`/`FacultyDashboard.tsx` migrated from manual `useEffect`/`Promise.all(Settled)` fetch state to React Query (`useQuery`/`useQueries`); 8 `SimpleTable` consumers migrated to the standardized `DataTable` (`@tanstack/react-table`) component — `ImportHistoryTable.tsx`, `UsersPage.tsx`, `AdminDashboardPage.tsx` (recent-activity table), `SyllabusManagerPage.tsx`, `AttendanceDashboard.tsx`, `EligibilityReport.tsx`, `PublishResults.tsx`, `AuditLog.tsx`.

**Deliberately left on `SimpleTable`/custom, confirmed poor fits for `DataTable`'s row-per-record model — do not migrate these without redesigning them first:**
- `components/admin/import/ImportPreviewTable.tsx` — dynamic runtime-generated columns + already-custom pagination/filter UI.
- `frontend/src/features/timetable/TimetableTableView.tsx` — a day×time-slot pivot grid, not tabular row data.

**Still open — `DashboardHome.tsx` vs `AdminDashboardPage.tsx` duplication.** Confirmed (not a false alarm) these are two independently-built "admin dashboard" experiences: `pages/dashboards/AdminDashboard.tsx` (routed at `/dashboard/admin`, reached via `DashboardHome.tsx`'s role-dispatch redirect, shows list-endpoint-derived counts) vs. `pages/admin/AdminDashboardPage.tsx` (routed separately at `/system/dashboard`, calls `GET /api/admin/dashboard/`, shows recent-activity + system info). Reconciling which one wins (merge, or clearly differentiate/rename) is a product decision, not touched this session.

**Not done — full design-system rollout** (spec Phases 10–20), unchanged from before:
- **No design tokens defined.** Typography/spacing/radius/elevation/breakpoints are still ad hoc Tailwind classes per component, no shared scale.
- **Application shell is still per-page, not a router-level layout route.** Every page individually wraps itself in `<DashboardLayout>` (`frontend/src/components/layouts/DashboardLayout.tsx`) rather than the router applying one shared layout with `<Outlet>`. Real duplication, low urgency (each page wrapping itself guarantees the shell renders correctly today) — do this as its own isolated, well-tested pass touching ~40 page files.
- **No shared status-badge system.** `Badge` component exists but status semantics (pending/approved/frozen/scheduled/cancelled/etc.) aren't centralized — each feature picks its own variant mapping.
- **Form UX not standardized** (labels/required indicators/section grouping/unsaved-state warnings) — out of scope entirely so far.
- **Accessibility pass not done** beyond what `Modal` picked up for free (`role="dialog"`, `aria-modal`, Escape-to-close). No systematic audit of focus order, icon-only button labels, contrast, or table semantics.
- **Responsive verification not done** — builds pass but no actual small-viewport testing occurred across major workflows.
- **Redesign was scoped to**: dashboards, timetable, students, attendance, results. **Finance, audit, and remaining admin screens were explicitly left untouched.**

## 3. Web performance — partially done

Done: route code splitting, vendor chunk splitting (`vite.config.ts` `manualChunks` for react/query/forms), bundle measured before/after (870KB→258KB entry, gzip 235KB→84KB), `rollup-plugin-visualizer` wired as opt-in (`npm run build:analyze`).

Not done:
- **Component-level lazy loading** for genuinely heavy widgets (large charts, PDF/report preview components) — only route-level splitting happened.
- **Query/render performance audit** (Phase 25) — no systematic pass for duplicate React Query keys, unnecessary refetch, or unpaginated large datasets. This session's dashboard React Query migration (§2) improves the worst offenders but a full audit hasn't happened.

---

## 4. Backend timetable domain — core done, follow-ups remain

Done and deployed: `TimetableEntry` model (normalized, `Section`-linked), RBAC migrated from the broken no-op `in_group()` checks to `PermissionTaskRequired` across the whole `timetable` app, `GET /api/mobile/student/timetable/` (Mobile API Freeze 02), `BLOCKED_BY_DATA_MODEL` resolved in student-home's `today_schedule`. This follow-up session additionally fixed a real gap found while writing e2e tests: the FACULTY/COORDINATOR `PermissionTaskRequired` fallback maps in `backend/core/permissions.py` were missing `academics.batches.view`/`academics.terms.view`/`academics.groups.view`, which silently left the `/timetable` page's batch/period/group dropdowns empty for those roles.

Not done:
- **Legacy `TimetableCell` data migration/removal.** `TimetableEntry` is purely additive — `Session`/`WeeklyTimetable`/`TimetableCell` (free-text line1/2/3 grid) still exist and still serve the current staff editor UI (`frontend/src/features/timetable/TimetableEditor.tsx`, `TimetableTableView.tsx`). No backfill of historical free-text cells into normalized entries has happened. Plan for this once `TimetableEntry` has been live long enough to trust: write a data migration that parses existing `TimetableCell.line1` (course/group text) against `academics.Course`/`Section` where possible, flag ambiguous ones for manual review, then retire the legacy model.
- **No recurrence engine.** Only simple per-week dated occurrences exist (matching the pre-existing `WeeklyTimetable` per-week shape). If genuine recurring-schedule needs emerge (e.g. "every Monday 9am for the whole semester"), that's new scope, not follow-up.
- **No `Room`/venue resource.** `TimetableEntry.room` is a plain `CharField`. If room-booking/conflict-detection across the whole institution (not just per-entry collision checks) becomes a real need, model it properly then.
- **The "exactly 3 periods per day" publish-validation rule** in `WeeklyTimetableViewSet.publish()` (`backend/sims_backend/timetable/views.py`) is a hardcoded business rule baked into the legacy flow — preserved as-is, not revisited. Worth asking whoever owns curriculum scheduling whether it's still correct before the legacy model is retired.
- **Two parallel academic-period hierarchies exist** (`academics.AcademicPeriod` vs. the newer `Program.periods`/`Track`/`LearningBlock`/`Module`) — flagged during discovery as worth reconciling, not touched this sprint. Understand which one is canonical before building more on either.

---

## 5. Security / credentials — audit tooling added, execution against production still pending

`backend/SEED_DATA_README.md` and `backend/DEMO_SEED_USAGE.md` document **predictable default passwords** (pattern: `{role}123`) for demo/seed accounts. This follow-up session added `backend/core/management/commands/audit_demo_accounts.py` — a **read-only** command that cross-references documented demo/seed username patterns (fixed accounts like `admin`/`registrar`/`faculty{n}`/`finance`/`examcell`, and dynamic patterns like `student{year}mbbs{n}`/`demo_studentNNN`) against real users and reports, per account, whether it still has the known default password. It never prints password values and makes no writes.

**Could not be run against production from this session** — no live `vexel_medsims_*` containers were reachable from this working directory (the repo checkout here isn't the production host's `git` clone; production runs elsewhere). Compiles cleanly (`py_compile`) but was not exercised against a real database with production-shaped data.

**Next session should:**
1. Run `docker exec <backend_container> python manage.py audit_demo_accounts` on the actual production host and review the output.
2. Determine which flagged accounts correspond to demo/QA-only users (vs. real staff/students) — do **not** assume based on username pattern alone; cross-check against real enrollment/employment records.
3. For any confirmed demo/QA-only accounts still active in production: rotate to strong unique passwords, or disable if unused. Never print or log actual credential values anywhere in that process.

---

## 6. Testing gaps

**Done this follow-up session:** Playwright e2e coverage added for the timetable feature — `frontend/e2e/tests/faculty/timetable.spec.ts` (staff add/cancel-entry + publish flow, RBAC route check) and `frontend/e2e/tests/student/timetable.spec.ts` (Today/Week toggle, empty states, API-failure alert, RBAC route check), backed by a new `backend/core/management/commands/seed_timetable_demo.py` (also fixed: no seed command previously created the `pilot_faculty`/`pilot_student` e2e accounts themselves — they existed only via manual setup against a persistent baseline DB). Verified against a real `docker compose` stack: 5/5 faculty + 6/6 student timetable specs passed, full faculty+student suite (32/33, 1 self-skip) showed no regressions.

Still open:
- **Pre-existing, unrelated test failures** (confirmed via `git stash` comparison against pre-sprint baseline in the original mega-sprint session, not caused by this work — do not "fix" them as part of unrelated future work without separately verifying scope):
  - `sims_backend/academics/tests/test_academics_module.py::TestLearningBlockTypeRules::test_rotation_block_cannot_have_modules`
  - `sims_backend/academics/tests/test_departments_api.py::TestDepartmentCreate::test_create_department_success` and `test_create_department_without_code`
  - `sims_backend/finance/tests/test_challan_permissions.py` and `test_views.py` fail to even collect — `ImportError: cannot import name 'Challan' from sims_backend.finance.models` (model referenced by tests doesn't exist in current `finance/models.py`)
  - Running `pytest sims_backend` broadly (rather than the documented `pytest tests`) also hits pytest module-basename collisions between the flat `backend/tests/` dir and app-local `sims_backend/*/tests/` packages (e.g. two `test_permissions.py`) — a `pytest.ini`/`__init__.py` hygiene issue, not a code bug.

---

## 7. Ops / deployment tooling — hardened, one item still open

**Done this follow-up session:**
1. `ops/deploy.sh` now refuses to run as root (root has no deploy key for this repo; `munaim` has both the SSH key and docker-group membership).
2. `ops/deploy.sh` now writes `APP_VERSION=$(git rev-parse HEAD)` into the deploy host's `.env` automatically before building, and force-recreates `backend`/`worker` after `up -d` so a new image actually takes effect.
3. `ops/deploy.sh` now explicitly targets `-f docker-compose.yml` (confirmed the actually-live file).

**Still open — `docker-compose.yml` vs `docker-compose.prod.yml`, more tangled than originally assumed.** The original note in this document claimed `docker-compose.prod.yml` was simply unused and recommended deleting it; investigation this session found that's **wrong** — root-level `backend.sh`, `frontend.sh`, and `both.sh` all actively target `docker-compose.prod.yml` and its `_prod`-suffixed container names (`vexel_medsims_backend_prod`, etc.). Meanwhile `ops/deploy.sh` (the automated path) uses `docker-compose.yml`, and production is currently running the **non**-`_prod` containers that path creates. So there are two live-looking deploy code paths that disagree about which containers are authoritative, and only one matches current production reality. This session added warning banners to `docker-compose.prod.yml`, `backend.sh`, `frontend.sh`, and `both.sh` flagging the mismatch rather than deleting anything, since the actual intended relationship between `ops/deploy.sh` (automated) and `backend.sh`/`frontend.sh`/`both.sh` (manual partial-deploy scripts) wasn't clear enough to safely collapse to one path without more context from whoever set them up. **Next session should:** confirm with whoever runs manual deploys whether `backend.sh`/`frontend.sh`/`both.sh` are still actually used, and either (a) update them to target `docker-compose.yml` to match reality, or (b) if `docker-compose.prod.yml`'s `_prod` naming is actually the intended target and `ops/deploy.sh`'s current container names are the drift, switch `ops/deploy.sh` to `-f docker-compose.prod.yml` instead — but that requires re-verifying the live Caddyfile/port mapping against `docker-compose.prod.yml` first, since the prior investigation only confirmed `docker-compose.yml` matches the *currently running* containers.

None of the ops changes above were verified against a live deploy this session — no production host was reachable from this working directory. Only `bash -n` syntax-checks and `docker compose config` validation were run locally.

---

## Suggested next-session priority order

1. **Reconcile the two deploy code paths (§7)** — now better understood but not resolved; higher priority than before since it's a two-script disagreement about what's actually running, not just missing automation.
2. **Run the security audit command against production and act on results (§5)** — the audit tooling exists now; running it and following through is the highest-risk open item.
3. **`DashboardHome.tsx` vs `AdminDashboardPage.tsx` reconciliation (§2)** — a product decision, moderate effort once decided.
4. **Android workstream (§1)** — large, separate effort; start once the backend contract has had some real production usage.
5. **Full design-system rollout + shell layout-route refactor (§2)** — the biggest remaining item; plan it as its own dedicated sprint with a real design pass, not squeezed alongside other work.
6. **Legacy `TimetableCell` retirement (§4)** — only once `TimetableEntry` has proven itself live for a while.
