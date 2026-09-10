# Vexel MedSIMS — Pending & Deferred Work

Status as of commit `60bc7e3` (2026-09-10 follow-up session: ops hardening, demo-account audit command, dashboard/table unification subset, and timetable e2e coverage landed on top of `ddfcf9f`, the "mega sprint" deploy to production `sims.vexel.pk`).

**2026-09-10, second follow-up session:** worked this document's priority list directly against production (`ssh test`, `/home/munaim/srv/apps/fmu-platform`). Resolved the deploy-path conflict (§7) with live evidence, found and fixed a real `ops/deploy.sh` bug (self-modifying-script corruption) discovered while deploying, found production was 5 commits behind and deployed it, ran the security audit (§5) and confirmed all flagged accounts are demo-only, and merged the duplicate admin dashboards (§2). See each section for detail.

**2026-09-11 session:** three workstreams executed in parallel (separate git worktrees, merged after independent review): testing gaps (§6, fully resolved, 1 new unrelated finding), legacy `TimetableCell` retirement (§4, backfill/publish/frontend done, model removal deliberately deferred), and ops deploy dry-run hardening (§7, scripts/docs done, the live supervised run itself still pending). All changes reviewed, verified against real test runs (including a live `docker compose` stack + Playwright for the timetable work), and committed to `main` as three separate commits.

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

**RESOLVED (2026-09-10 follow-up session) — `DashboardHome.tsx` vs `AdminDashboardPage.tsx` duplication.** Investigation found `AdminDashboard.tsx` (`/dashboard/admin`) is the page every Admin actually lands on (role-dispatch default from `DashboardHome.tsx`), while `AdminDashboardPage.tsx` (`/system/dashboard`) was orphaned — registered in the router but linked from no nav item or button anywhere. Merged `AdminDashboardPage.tsx`'s unique content (Faculty count, 7-day attendance summary, Recent Activity table, System Information panel) into `AdminDashboard.tsx` via a new `useQuery(['admin-dashboard'], dashboardApi.getAdminDashboard)` call, kept `AdminDashboard.tsx`'s existing unique widgets (Sections/Sessions/Published/Draft Results counts, Module Entry Points grid), removed the `/system/dashboard` route and lazy import from `appRoutes.tsx`, and deleted `pages/admin/AdminDashboardPage.tsx`. Added `AdminDashboard.test.tsx` (previously no test coverage existed for this page). Verified: `npm run build`, `tsc --noEmit`, and the full `vitest` suite (50/50) all pass.

Separately flagged, not touched: `components/admin/AdminSidebar.jsx` / `AdminLayout.jsx` reference non-existent `/adminpanel/*` routes and aren't imported anywhere — dead code, a small standalone cleanup.

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

## 4. Backend timetable domain — core done; legacy `TimetableCell` retirement mostly done

Done and deployed: `TimetableEntry` model (normalized, `Section`-linked), RBAC migrated from the broken no-op `in_group()` checks to `PermissionTaskRequired` across the whole `timetable` app, `GET /api/mobile/student/timetable/` (Mobile API Freeze 02), `BLOCKED_BY_DATA_MODEL` resolved in student-home's `today_schedule`. A prior follow-up session additionally fixed a real gap found while writing e2e tests: the FACULTY/COORDINATOR `PermissionTaskRequired` fallback maps in `backend/core/permissions.py` were missing `academics.batches.view`/`academics.terms.view`/`academics.groups.view`, which silently left the `/timetable` page's batch/period/group dropdowns empty for those roles.

**Done this session (2026-09-11) — legacy `TimetableCell` retirement, steps B1–B4/B6:**
- **B1**: new data migration `backend/sims_backend/timetable/migrations/0006_backfill_cells_to_entries.py` backfills existing `TimetableCell` rows into `TimetableEntry` by matching `line1` free text against `academics.Course`/`Section`, parsing `time_slot` into `start_time`/`end_time`, and carrying `line2` into `room`. Ambiguous/unmatched cells are logged to migration stdout for manual review, never guessed — verified against 5 hand-built scenarios (confident match, ambiguous, no-match, bad time format, empty cell).
- **B2**: `WeeklyTimetableViewSet.publish()`'s "exactly 3 periods per day" validation now reads from `TimetableEntry` (excluding `CANCELLED`) instead of `TimetableCell`. Same business rule, same response shape, new data source.
- **B4**: the legacy free-text grid editor (`TimetableEditor.tsx`/`TimetableTableView.tsx`) is unwired from `TimetablePage.tsx` — staff now manage a week's schedule entirely through `EntriesPanel`/`EntryForm`. The component files themselves are left in the repo, unwired, in case removal reveals a workflow gap later. No such gap was found during this session's verification.
- **B6**: `seed_timetable_demo.py` now seeds `TimetableEntry` rows (not `TimetableCell`) for the publish-flow demo data; e2e tests updated to match.
- Verified: full backend `pytest tests -q` green, `pytest sims_backend/timetable`/`sims_backend/mobile` green, migration applies cleanly against a fresh DB, frontend `tsc --noEmit`/`npm run build` clean, and — against a live `docker compose` stack this session — 10/11 Playwright timetable e2e specs passed (the 1 failure was a stale test-string assertion, fixed).

**Not done — deliberately deferred, needs explicit go-ahead:**
- **B3 (partial)**: `backend/sims_backend/mobile/timetable_resolution.py`'s fallback to the legacy `TimetableCell` grid (`_cell_to_dict`) is **kept in place**, not removed — this session had no way to verify against real production data that every published `WeeklyTimetable` has full `TimetableEntry` coverage after B1's backfill. It's now clearly marked in the module docstring as a legacy-safety-net-only path, not the primary one.
- **B5 — `TimetableCell` model/table removal.** The model, `TimetableCellViewSet`, `TimetableCellSerializer`, and the `/api/timetable/cells/` route are all still fully intact and functioning — intentionally not touched (destructive, hard-to-reverse schema change). **To do this safely:** (1) run migration `0006` against production data and review its logged ambiguous/unmatched cases, (2) confirm `WeeklyTimetable.objects.filter(status="published", entries__isnull=True, cells__isnull=False)` returns empty in production, (3) only then remove the mobile fallback (B3) and drop the model/viewset/route.
- **No recurrence engine.** Only simple per-week dated occurrences exist. New scope if genuine recurring-schedule needs emerge, not follow-up.
- **No `Room`/venue resource.** `TimetableEntry.room` is a plain `CharField`. Model properly if room-booking/conflict-detection across the whole institution becomes a real need.
- **Two parallel academic-period hierarchies exist** (`academics.AcademicPeriod` vs. the newer `Program.periods`/`Track`/`LearningBlock`/`Module`) — still not reconciled. Understand which one is canonical before building more on either.

---

## 5. Security / credentials — audit run against production (2026-09-10 follow-up session)

`backend/SEED_DATA_README.md` and `backend/DEMO_SEED_USAGE.md` document **predictable default passwords** (pattern: `{role}123`) for demo/seed accounts. `backend/core/management/commands/audit_demo_accounts.py` is a **read-only** command that cross-references documented demo/seed username patterns against real users and reports, per account, whether it still has the known default password. It never prints password values and makes no writes.

**Run against production this session** (after deploying the commit that introduced it — see §7, production was 5 commits behind before this session's deploy): `docker exec vexel_medsims_backend python manage.py audit_demo_accounts` on `ssh test` / `/home/munaim/srv/apps/fmu-platform`.

**Result:** 54 accounts matched known demo/seed patterns, and **all 54** still have the documented default password. Every flagged account uses the `@examplemedical.edu` placeholder email domain, was created the same day (2026-09-08), and has never logged in (`last_login: never`) — consistent with this entire instance currently holding pilot/demo data rather than a mix with real staff/students.

**User decision (2026-09-10): confirmed demo-only, leave passwords as-is for now** — no rotation/disabling performed. Revisit before this instance is handed to real users: at that point, re-run the audit and rotate/disable any accounts confirmed as demo-only once real accounts exist to distinguish them from.

---

## 6. Testing gaps — RESOLVED (2026-09-11 session), one new item found

**Done previously:** Playwright e2e coverage added for the timetable feature — `frontend/e2e/tests/faculty/timetable.spec.ts` (staff add/cancel-entry + publish flow, RBAC route check) and `frontend/e2e/tests/student/timetable.spec.ts` (Today/Week toggle, empty states, API-failure alert, RBAC route check), backed by a new `backend/core/management/commands/seed_timetable_demo.py`. Verified against a real `docker compose` stack: 5/5 faculty + 6/6 student timetable specs passed, full faculty+student suite (32/33, 1 self-skip) showed no regressions.

**Done this session (2026-09-11) — all four previously-open items resolved:**
- `test_rotation_block_cannot_have_modules` — fixed: the test instantiated a `Module` but never persisted it before asserting the validator raised. Now creates a real `Module.objects.create(...)` first.
- `test_departments_api.py::TestDepartmentCreate` — root-caused with a live traceback: `DepartmentSerializer`'s `unique_together` on `(name, parent)` forced the nullable `parent` field to be `required=True` by DRF default, and separately, DRF's auto `UniqueTogetherValidator` silently skips its check whenever a constrained field is `None` — meaning duplicate root-level department names weren't actually being rejected. Both fixed in `backend/sims_backend/academics/serializers.py` (explicit `extra_kwargs` for `parent`, and an explicit `(name, parent)` uniqueness check in `validate()`).
- `test_challan_permissions.py`/`test_views.py` (finance) — rewritten against the current `Voucher`/`Payment`/`LedgerEntry`/`FeePlan` models and `/api/finance/vouchers/|payments/|ledger/` endpoints, using the task-based `PermissionTaskRequired` RBAC pattern already used elsewhere in the app. Confirmed real current behavior along the way: only `LedgerEntryViewSet` has a student self-service carve-out (own records, or empty list if unlinked); `VoucherViewSet`/`PaymentViewSet` are task-gated with no such carve-out — a plain student gets 403, not a filtered 200.
- Pytest collection collision — fixed: added missing `__init__.py` to every `sims_backend/*/tests/` directory that lacked one (`academics`, `finance`, `results`, `students/imports`, plus `backend/tests/learning/`), and added `--import-mode=importlib` to `pytest.ini`'s `addopts` as a second layer of defense. `pytest sims_backend -q` now collects and runs cleanly.

Verified: `pytest tests -q` — 212/212 green, no regressions. `pytest sims_backend -q` — 128 passed, 6 failed (see below, unrelated).

**New item found this session:**
- **`sims_backend/attendance/tests/` has 6 failing tests**, confirmed pre-existing and unrelated to this session's finance/academics/pytest-config work (isolated by running `pytest sims_backend/attendance` alone — same 6 failures). Not investigated further; root cause unknown. Next session should get a live traceback the same way `test_departments_api.py` was diagnosed here.

---

## 7. Ops / deployment tooling — RESOLVED (2026-09-10 follow-up session)

**Done this follow-up session:**
1. `ops/deploy.sh` now refuses to run as root (root has no deploy key for this repo; `munaim` has both the SSH key and docker-group membership).
2. `ops/deploy.sh` now writes `APP_VERSION=$(git rev-parse HEAD)` into the deploy host's `.env` automatically before building, and force-recreates `backend`/`worker` after `up -d` so a new image actually takes effect.
3. `ops/deploy.sh` now explicitly targets `-f docker-compose.yml` (confirmed the actually-live file).

**`docker-compose.yml` vs `docker-compose.prod.yml` conflict — resolved via direct production SSH access this session.** Connected to the production VM (`ssh test`, repo at `/home/munaim/srv/apps/fmu-platform`) and read ground truth directly:
- `cat /etc/caddy/Caddyfile`'s `sims.vexel.pk` block proxies `/api/*` to `127.0.0.1:18010` and everything else to `127.0.0.1:18080`.
- `docker ps` shows the running containers are `vexel_medsims_backend`/`vexel_medsims_frontend`/`vexel_medsims_db`/`vexel_medsims_redis`/`vexel_medsims_rq_worker` — **non**-`_prod` names — with backend published on `18010` and frontend on `18080`.
- The VM's `.env` sets `BACKEND_HOST_PORT=18010` and `FRONTEND_HOST_PORT=18080`, which `docker-compose.yml` reads via `${BACKEND_HOST_PORT:-8010}` / `${FRONTEND_HOST_PORT:-8080}` — so `docker-compose.yml` + this `.env` override is exactly what's live and exactly matches Caddy on both ports.
- `docker-compose.prod.yml` hardcodes backend `18010` (correct, by coincidence) but frontend `8080` (hardcoded, **not** `18080`) — it does not match live Caddy for the frontend path and is stale.

**Conclusion: `docker-compose.yml` (with the VM's `.env` overrides) is canonical.** `ops/deploy.sh` already used it correctly. `backend.sh`, `frontend.sh`, and `both.sh` were updated this session to target `docker-compose.yml`, non-`_prod` container names, and ports `18010`/`18080` instead of `docker-compose.prod.yml`/`8010`/`8080`. `docker-compose.prod.yml`'s header comment was updated to flag it as not currently live; it was not deleted in case a genuinely separate `_prod` stack is wanted later — a call for whoever owns ops to make.

**Done this session (2026-09-11) — health checks and rollback hardened, per the earlier "not yet done" gap analysis:**
- Backend health check in `backend.sh`/`both.sh` now hard-fails (`exit 1`) when `/api/health/` reports anything other than `"status": "ok"` — previously it only grepped for the `"status"` key's presence, so a `"degraded"` response (DB/migration/Redis trouble) passed silently.
- All three scripts now capture and print each service's pre-rebuild image ID (`docker inspect --format='{{.Image}}' vexel_medsims_<service>'`) before `build --no-cache`, giving a human a concrete reference to revert to.
- `docs/PRODUCTION_RUNBOOK.md`'s rollback section was stale (still referenced `docker-compose.prod.yml`) — corrected to match the confirmed-canonical `docker-compose.yml` + container names/ports, and expanded with concrete revert commands (git checkout + rebuild, or manual image retag).
- Added a new "Deploy Dry-Run / Maintenance Window Procedure" section to `docs/PRODUCTION_RUNBOOK.md`: who to notify, pre-checks, exact command sequence, what "success" looks like beyond the curl checks (public health URL through Caddy + 2-3 real page visits), and rollback trigger criteria.
- Verified: `bash -n` on all three scripts, and the new health-check grep pattern tested locally against both `"ok"` and `"degraded"` sample JSON (correctly distinguishes them).

**Still not done:** the actual supervised end-to-end dry run itself — running `both.sh` against production during a real maintenance window, with a human present watching output live. This is a live production action, not a code task; it needs to be scheduled and run with the user present, not automated.

---

## Suggested next-session priority order

1. ~~Reconcile the two deploy code paths (§7)~~ — **RESOLVED 2026-09-10.**
2. ~~Run the security audit command against production and act on results (§5)~~ — **DONE 2026-09-10** (all flagged accounts confirmed demo-only; passwords left as-is per user decision, revisit before real users are onboarded).
3. ~~`DashboardHome.tsx` vs `AdminDashboardPage.tsx` reconciliation (§2)~~ — **RESOLVED 2026-09-10** (merged into `AdminDashboard.tsx`).
4. ~~Testing gaps (§6)~~ — **RESOLVED 2026-09-11** (finance tests rewritten, rotation-block fixture fixed, department serializer bug found and fixed, pytest collision fixed). New unrelated item found: 6 failing tests in `sims_backend/attendance/tests/`, not yet investigated.
5. ~~Legacy `TimetableCell` retirement — steps B1/B2/B4/B6 (§4)~~ — **DONE 2026-09-11**, verified against a live stack. **Remaining before this item is fully closed:** run migration `0006_backfill_cells_to_entries` against production data, confirm full `TimetableEntry` coverage for published weeks, then remove the mobile fallback (B3) and drop the legacy model/viewset/route (B5) — a deliberately deferred, destructive schema change.
6. ~~Ops deploy dry-run script/doc hardening (§7)~~ — **DONE 2026-09-11** (health checks now hard-fail on degraded status, rollback image-ID capture added, stale runbook corrected, maintenance-window procedure documented). **Remaining:** the actual supervised live dry run against production, scheduled with the user present.
7. **Investigate the 6 failing `sims_backend/attendance/tests/`** (found 2026-09-11, not yet diagnosed) — get a live traceback the same way `test_departments_api.py` was resolved this session.
8. **Android workstream (§1)** — large, separate effort; start once the backend contract has had some real production usage.
9. **Full design-system rollout + shell layout-route refactor (§2)** — the biggest remaining item; plan it as its own dedicated sprint with a real design pass, not squeezed alongside other work.
