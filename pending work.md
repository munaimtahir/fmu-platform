# Pending Work: Full Backend-to-Web Functional Parity

Handoff document. Last updated 2026-09-19 (session stopped by API rate limits, not by a blocker).
Read this top to bottom before touching anything. It is written so a new agent can continue exactly where work stopped.

Repo: `/home/munaim/srv/apps/fmu-platform` (Django backend in `backend/`, React frontend in `frontend/`, Android app in `android/`, docs in `docs/`).
Current branch: `feat/web-parity` (based on `main` at `93be5ed`). **Nothing on this branch is committed yet.** Everything below "Phase 1" is uncommitted working-tree state.

---

## 1. The task (as the user specified it)

Implement every meaningful backend business workflow in the React frontend, fix broken routes/contracts, remove the obsolete admissions flow, then deploy once all gates pass.

Fixed decisions from the user:

- Work on one feature branch, ONE final commit `feat(web): complete backend workflow exposure`, fast-forward merge to `main`, push, back up production, deploy with `./both.sh`.
- Do NOT expose mobile-only endpoints, deprecated auth aliases, health/schema endpoints, or nested helper endpoints as standalone screens.
- Compliance policy: Students view/submit only their own requirements. Admin and Registrar define, assign, review, verify and reject. Everyone else is denied unless explicitly granted a task.
- The user asked (and was answered) these questions:
  - Compliance auth hole: **fix now, ship separately** (done, see Phase 0).
  - `learning` and `notifications` apps: **extend task codes to both** (done, backend).
  - Two "me" endpoints: keep both (`/api/auth/me/` unchanged; frontend additionally loads `/api/core/users/me/`). The user delegated this to best practice.
  - CI stays manual (`workflow_dispatch`); do not add push/PR triggers. Only add the new web parity checker script and run it in the pre-deploy gate.
- Plan file (outside the repo, may not be readable by you): `/home/munaim/.claude/plans/full-backend-to-web-functional-graceful-sprout.md`. Its content is summarized here.

Roles in scope (8): Admin, Registrar, Coordinator, Faculty, ExamCell, Finance, Student, OfficeAssistant. Backend Django Group names are UPPER_SNAKE (`OFFICE_ASSISTANT`, `EXAMCELL`) but real data also has mixed-case duplicates (e.g. 45 users in `Student`, 6 in `STUDENT`), so matching is case-insensitive.

---

## 2. Status at a glance

| Phase | What | Status |
|---|---|---|
| 0 | Compliance + transcript-enqueue authorization hotfix | **DONE, merged to main, deployed, verified in production** |
| 1 | Backend contracts (RBAC catalog, effective access, voucher cancel, task-based learning/notifications/transcripts, dashboard stats, biometric gate, OpenAPI) | **DONE in working tree, tested, NOT committed** |
| 2 | Frontend foundation (access model, guarded routes, landing map, building blocks, parity checker, e2e infra) | **DONE in working tree, tested, NOT committed** |
| 3 | Frontend workflow screens (5 parallel workers) | **PARTIAL. Unreviewed draft code from workers that hit rate limits. See section 6.** |
| 4 | Test expansion (vitest for new screens, Playwright for 8 roles) | **Foundation tests done. Screen tests and all new Playwright specs pending** |
| 5 | Isolated gate on this VPS, single commit, merge, push, deploy, production verification | **NOT STARTED** (one sub-verification done, see 4.3) |

---

## 3. Phase 0: DONE and live in production

Commit `93be5ed` on `main`, pushed and deployed at 2026-09-19 ~19:05 UTC. Production health version equals `93be5ed`. Verified in production inside a rollback-only transaction (no data changed): Student/Faculty/ExamCell get 403 on `/api/compliance/admin-compliance/`, `/api/compliance/definitions/` and on transcript enqueue for other students; Registrar gets 200.

What it fixed:
- `AdminComplianceViewSet` and `RequirementDefinitionViewSet` were `IsAuthenticated` only (any user, including students, could verify/reject/assign/delete). Now `PermissionTaskRequired` with `compliance.*` codes.
- `enqueue_transcript_generation` let any non-student enqueue a transcript for anyone. Now shares `_transcript_access_denied` with `get_transcript`.
- Tests: `backend/tests/test_compliance_authz.py`.

Rollback images for the state BEFORE Phase 0 exist: `fmu-platform-backend:rollback-5fb8d8b`, `fmu-platform-frontend:rollback-5fb8d8b`. Backup: `backups/pre-deploy-compliance-authz-20260919-190103.sql.gz`.

---

## 4. Phase 1: backend (DONE, uncommitted)

### 4.1 What was built

| Area | Files | Notes |
|---|---|---|
| Canonical RBAC catalog | `backend/core/rbac_catalog.py` (new) | Single source of truth: `TASK_CODES` (179 codes), `SYSTEM_ROLES` (8), `BUILTIN_ROLE_PREFIXES`, `BUILTIN_ADMIN_ALWAYS_PREFIXES`, `seed_rbac_catalog(apps)` (idempotent, never edits/deletes existing rows) |
| Seed migration | `backend/core/migrations/0003_seed_rbac_catalog.py` (new) | Creates tasks, roles (names are UPPER_SNAKE to match Group names), and default role-task assignments mirroring the built-in fallback. ADMIN role gets NO assignments (implicit-all via fallback) |
| Permission logic | `backend/core/permissions.py` | Refactored: built-in fallback is ALWAYS consulted; group-to-role matching is case-insensitive; new helpers `get_effective_roles`, `get_effective_task_codes`, `get_user_group_names` |
| Effective access | `backend/core/serializers.py` (`UserMeSerializer`) | `/api/core/users/me/` shape unchanged; `roles` and `tasks` now effective (direct + role + built-in + superuser). Tasks without a DB row get `id: null` |
| Voucher cancel | `backend/sims_backend/finance/views.py`, `serializers.py` | `POST /api/finance/vouchers/{id}/cancel/` `{reason}`; requires `finance.vouchers.cancel`; 400 `ALREADY_CANCELLED`; **extra guard** 400 `PAYMENTS_EXIST` when a verified, unreversed payment exists (reversals are only marked by a `[REVERSED]` note, so cancelling would double-credit the ledger). This guard was NOT in the user's spec; mention it in the release notes |
| Learning | `sims_backend/learning/views.py`, `permissions.py` | Now `PermissionTaskRequired` (`learning.materials.*`, `learning.feed.view`); `IsAdminOrFaculty` and `IsStudentOnly` removed; `LearningMaterialObjectPermission` (ownership) kept |
| Notifications | `sims_backend/notifications/views.py`, `common_permissions.py` | `notifications.admin.{view,create,send}`, `notifications.inbox.{view,update}`; `send_now` on create additionally requires `.send`; legacy `IsNotificationAdmin` / `IsStudentOrNotificationAdmin` removed |
| Transcripts | `sims_backend/transcripts/views.py` | Student-own automatic; staff need `transcripts.transcripts.generate`; emailing needs `.email`. Admin/Registrar/Finance hold them by default; ExamCell only if explicitly assigned. `FINANCE_BLOCKED` unchanged |
| Dashboard stats | `backend/core/views.py` (`dashboard_stats`) | New REGISTRAR and EXAMCELL branches (a pure Registrar/ExamCell used to get "No statistics available"). Keys listed in `tests/test_phase1_contracts.py::TestDashboardStatsByRole` |
| Biometric ingestion | `sims_backend/attendance/input_views.py` | `BiometricPunchAPIView` was open to ANY authenticated user (a second live authorization hole found during this work). Now requires `attendance.biometric.ingest` (Admin only by default). Production has 0 punches and 0 devices, so nothing depended on it. **Ships with the final release, not hotfixed.** Tell the user |
| OpenAPI | `docs/openapi-schema.yaml`, `android/api/openapi-current.yaml` | Byte-identical mirrors. Only the cancel path + `VoucherCancel` schema were added (see 4.4) |

### 4.2 Backend tests (all passing when last run)

- `backend/tests/test_rbac_catalog.py` (59): catalog completeness scan (fails if any code used in the backend is missing from `TASK_CODES`), seed idempotency, "seeding never changes effective access" for 15 group combinations including mixed case and Admin+domain pilot accounts, task rows without Role rows do not revoke fallback, effective codes equal enforced codes.
- `backend/tests/test_phase1_contracts.py` (21): `me` payload, voucher cancel matrix, dashboard stats by role.
- `backend/tests/test_task_permission_parity.py`: learning/notifications/transcripts legacy-vs-new access matrix, biometric gate.
- Last full runs: `tests/` = 400 passed (before the biometric tests were appended; re-run), `sims_backend/` = 109 passed with 4 uncollectable files (pre-existing package-name collision, unrelated).

### 4.3 Verified against real production data (important)

Production backup was restored into a throwaway Postgres and the migration applied there. Results (60 real users, 179 codes):
- Old permission code vs new code (before migration), legacy modules: **0 differences**.
- Before vs after migration 0003, all codes: **0 differences**.
- Effective tasks vs enforced tasks: **0 mismatches**.
- Production currently has 0 `PermissionTask`, 0 `Role`, 0 assignments; ALL access comes from the built-in fallback keyed on Django Groups.

Key gotcha discovered: the ORIGINAL `has_permission_task` returned False when a task row existed but the user had no matching `Role` row (it never reached the fallback). Seeding tasks without roles would have silently revoked access. Fixed by always consulting the fallback. Do not "simplify" this back.

The throwaway container was removed. To recreate: `docker run -d --name fmu_gate_pg -e POSTGRES_USER=vexel_medsims_app -e POSTGRES_DB=vexel_medsims -e POSTGRES_PASSWORD=gatepw -p 127.0.0.1:15499:5432 postgres:16-alpine`, wait until `psql select 1` succeeds 3 times in a row (first boot restarts the server), then `zcat backups/<file>.sql.gz | docker exec -i fmu_gate_pg psql -q -U vexel_medsims_app -d vexel_medsims -v ON_ERROR_STOP=1`. Remove it when done.

### 4.4 How to run backend checks

```bash
cd backend
export MEDIA_ROOT=$(mktemp -d) DJANGO_SECRET_KEY=test-secret-key DJANGO_DEBUG=False APP_VERSION=test \
  DB_ENGINE=django.db.backends.sqlite3 DB_NAME=:memory: DB_HOST= DB_PORT=0
.venv/bin/python -m pytest tests -p no:cacheprovider -o addopts="" -q      # use .venv, NOT system python
.venv/bin/python -m ruff check <files you touched>
```

- `MEDIA_ROOT` must be a temp dir: `backend/media` is root-owned, so faculty-import tests otherwise 500.
- Test settings DISABLE migrations, so data migrations must be tested by calling their function directly (as `test_rbac_catalog.py` does).
- Pre-existing, unrelated, leave alone: 6 ruff errors in files you did not touch (a timetable migration, `sims_backend/urls.py`, `tests/test_timetable_entry.py`).

### 4.5 OpenAPI regeneration (easy to get wrong)

The committed schema was generated with the **Postgres** engine (integer max ranges differ on SQLite). `backend/scripts/check_openapi_schema.sh` already fails on clean `main` (15 pre-existing lines: `/api/health/` and a "Get list of group names." description exist only in the committed file). Do NOT overwrite the committed files wholesale. Method used:

1. Generate baseline from an untouched export: `git archive HEAD backend | tar -x -C <scratch>`, run `python manage.py spectacular --file base.yaml` with `DB_ENGINE=django.db.backends.postgresql DB_NAME=x DB_USER=x DB_PASSWORD=x DB_HOST=127.0.0.1 DB_PORT=1` (no connection is made).
2. Generate the same way from the working tree.
3. `diff -u base.yaml new.yaml | patch <each committed mirror>`; confirm the two mirrors are still byte-identical (`cmp`), then run `python3 android/scripts/check_parity_register.py`.

Any viewset docstring edit is a schema change (drf-spectacular publishes docstrings). If you change a serializer or add an endpoint, repeat this.

---

## 5. Phase 2: frontend foundation (DONE, uncommitted)

Verified: `npx tsc --noEmit` clean, eslint clean, `npm run build` succeeds, all foundation tests pass, `python3 scripts/check_web_parity.py` passed in dev mode at the end of Phase 2.

| Piece | Files |
|---|---|
| Access model + landing map | `frontend/src/features/auth/access.ts` (`normalizeRole`, `canAccess`, `LANDING_PATHS`, `landingPathFor`), `frontend/src/api/access.ts` |
| Auth store | `features/auth/authStore.ts`: adds `roles`, `tasks`, `accessLoaded`, `loadAccess()`; loaded after login, on session restore and after impersonation; `initialize()` is now a no-op once loaded (ProtectedRoute calls it on every mount). `useAuth.ts` login awaits `loadAccess`. `ImpersonationDialog.tsx` reloads access |
| Route registry (fail closed) | `frontend/src/config/routeAccess.ts`: `path -> {tasks?, roles?}`, any-of, OR between tasks and roles; unregistered route = denied. `navConfig.ts` now only lists structure; visibility comes from `routeAccess`. `Sidebar.tsx` filters with it |
| Guard | `features/auth/ProtectedRoute.tsx`: REQUIRED `path` prop; waits for `accessLoaded`; denies unregistered paths |
| Routes | `routes/appRoutes.tsx` regenerated from one table (66 routes). Added: coordinator/office-assistant dashboards, people, students/:id, sections/:id, compliance, my-compliance, learning, learning/manage, gradebook, results/:id, results/corrections, finance/fee-types|ledger|adjustments|policies|vouchers/:id, notifications/manage, system/faculty/import. `/verify/:token` moved OUT of the authenticated layout. Catch-all now renders `NotFoundPage` |
| Landing map | Admin `/dashboard/admin`, Registrar `/dashboard/registrar`, Faculty `/dashboard/faculty`, Student `/dashboard/student`, ExamCell `/dashboard/examcell`, Coordinator `/dashboard/coordinator`, Finance `/finance`, OfficeAssistant `/dashboard/office-assistant`. `pages/DashboardHome.tsx` is a redirect (fixes the old infinite redirect loop for Coordinator/Finance/OfficeAssistant); the "Stage 2..5" cards are gone |
| Removed | `/apply`, `StudentApplicationPage.tsx`, `services/studentApplications.ts`, `StudentApplication*` types, dead `LegacyRouteGuard.tsx` (backend never had these endpoints; `apps/intake` backend form left untouched) |
| Shared building blocks | `lib/apiErrors.ts` (`parseApiError`, `apiErrorMessage`), `lib/download.ts` (`downloadFile`, `useDownload`, blob-error decoding), `lib/multipart.ts`, `lib/pagination.ts`, `hooks/useDebouncedValue.ts`, `components/shared/ConfirmDialog.tsx` (`requireReason`), `components/shared/Can.tsx`, `features/auth/useCapabilities.ts` |
| Bugs the parity checker caught and fixed | `services/programs.ts` used non-existent `/api/programs/{id}/`; `services/academics.ts` called non-existent `/api/users/` (removed, sessions fallback kept); results-corrections task `.view` never existed |
| Web parity registry + checker | `frontend/scripts/check_web_parity.py`, `frontend/parity/register.json` (exclusions), `frontend/parity/workflows/*.json` (47 workflows). npm scripts `parity` and `parity:strict`. Rules: business path registered or excluded; no stale paths; frontend `/api/...` literals must exist and be registered; declared artifacts exist; task codes exist in the catalog; routes match `routeAccess`. `--strict` also requires every workflow `implemented` with at least one test |
| Deliberate exception | Web student timetable reuses `/api/mobile/student/timetable/`; it is registered in the `timetable` workflow (only `/api/mobile/student/home/` is excluded) |
| e2e infra | 8 roles in `e2e/data/test-data.ts`, `e2e/global.setup.ts` (waits for `/(dashboard|finance)/`), `playwright.config.ts` (projects coordinator/finance/office), `e2e/fixtures/auth.ts`, npm scripts `e2e:coordinator|finance|office`. Existing spec PUB-04 rewritten (asserts `/apply` is gone). Empty dirs `e2e/tests/{coordinator,finance,office}/` created for new specs |
| Git hygiene (staged deletions) | Untracked from git: `frontend/e2e/e2e/auth/.auth/*.json` (5 expired localhost tokens), `frontend/playwright-report/index.html`, `frontend/test-results/.last-run.json`. Added `e2e/e2e/` to `frontend/.gitignore` |

Frontend commands: `cd frontend && npm ci` (already done locally), `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, `npm run build`, `python3 scripts/check_web_parity.py [--strict]`.

`seed_pilot_baseline` already seeds all 8 pilot accounts (`pilot_admin` is a superuser; password `password123`), so no seed change was needed.

---

## 6. Phase 3: workflow screens (PARTIAL: read carefully)

Five parallel workers were launched (people/students/compliance/learning; exams/results/transcripts; finance; dashboards/notifications/attendance; admin/academics/timetable/RBAC). **All five died on API rate limits mid-task.** They wrote a lot of code but:

- **None of it has been reviewed or run by a human/lead.** Treat it as unreviewed drafts.
- **They did not update the parity JSON**: 36 of 47 workflows are still `planned` with `tests: []`, including ones whose pages exist.
- They did not report; the list below comes from inspecting the working tree, not from their reports.

### 6.1 Known broken right now (fix first)

Last observed (after workers stopped):
- `npx tsc --noEmit`: 3 errors in `src/pages/learning/AudienceDialog.tsx` (line 36 reads `course_code`, `name`, `academic_period_name` which do not exist on `Section`).
- `npx vitest run`: 178 passed, **2 failed** in `src/services/attendance.test.ts` ("should call session-based mark endpoint with correct payload", "should accept valid status values"), caused by an in-progress change to `services/attendance.ts`.
- `python3 scripts/check_web_parity.py`: 1 failure: `services/learning.ts` calls `/api/learning/audiences/{id}/`, which is excluded as a nested helper route. Decide: either switch to the nested route, or (if the nested route has no DELETE) remove the exclusion and register it in the `learning-materials` workflow with a note.
- ESLint was clean.

### 6.2 Still skeleton pages (render "Not built yet")

`pages/learning/LearningFeedPage.tsx`, `pages/learning/LearningMaterialsPage.tsx` (its `MaterialForm.tsx` and `AudienceDialog.tsx` exist), `pages/results/GradebookPage.tsx` (its `services/gradebook.ts` exists), `pages/admin/FacultyImportPage.tsx`.

### 6.3 Files that exist and look substantially written (UNVERIFIED)

- People/students/compliance: `pages/people/{PeopleListPage,PersonDetailPage,PersonForm,PersonSections}.tsx`, `services/people.ts`, `services/leavePeriods.ts`, `pages/students/` (StudentDetailPage), `features/students/StudentsPage.tsx`, `pages/compliance/{ComplianceAdminPage,DefinitionsTab,RequirementsTab,MyCompliancePage,complianceUi}.tsx`, `services/compliance.ts`, `lib/mediaUrl.ts`.
- Exams/results/transcripts: `pages/exams/{ExamsPage,ExamComponentsModal,ExamFormModal,examForm}`, `pages/results/{ResultDetailPage,ResultCorrectionsPage,CorrectionRequestModal,CorrectionResultPicker,CorrectionReviewModal,ResultWorkflowActions,correctionForm}`, `pages/examcell/PublishResults.tsx`, `services/{exams,results,resultCorrections,transcripts}.ts`. `pages/transcripts/TranscriptsPage.tsx` was NOT observed as changed: verify.
- Finance: `pages/finance/{FeeTypesPage,FeePlansPage,PaymentsPage,VoucherDetailPage,LedgerPage,AdjustmentsPage,FinancePoliciesPage}` plus shared `features/finance/{FinanceLookups,FormBits,PagedTable,financeFormat}`, `components/shared/LabeledSelect.tsx`, `services/finance.ts`. Report pages were touched (download migration).
- Dashboards/notifications/attendance: `pages/dashboards/{StatsDashboard,CoordinatorDashboard,OfficeAssistantDashboard,RegistrarDashboard,ExamCellDashboard}` + `StatsDashboards.test.tsx`, `pages/admin/{NotificationAdminPage,NotificationComposeModal}` + tests, `services/{notificationsAdmin,attendanceEligibility,attendance}.ts`, `pages/attendance/{AttendanceDashboard,EligibilityReport}`. Biometric panel on `AttendanceInputPage.tsx` was being added when the worker died: verify it exists and is gated by `attendance.biometric.ingest`. Profile change-password (`pages/ProfilePage.tsx`) not observed as changed: verify.
- Admin/academics/timetable/RBAC: `features/timetable/{SessionsPanel,SessionForm,EntriesPanel,EntryForm,TimetablePage}`, `pages/academics/AcademicPeriodsPage.tsx`, `features/sections/{SectionDetailPage,SectionsPage,SectionForm}`, `services/rbac.ts`, `pages/admin/rbac/{RolesTab,TasksTab}` (assignment and per-user-override tabs not observed), `pages/admin/userRoles.ts`, `pages/admin/UsersPage.tsx`. NOT observed as changed: `pages/admin/RolesPage.tsx` (may still be the static page), `pages/admin/AuditLog.tsx` (backend export/detail), `pages/admin/StudentsImportPage.tsx` (Details dialog still `console.log`?). Verify each.

### 6.4 Definition of done for each Phase 3 workflow (the conventions given to the workers)

Per the plan: paginated, searchable tables; explicit loading/error/empty states; server validation mapped to fields; query invalidation after writes; authenticated Blob downloads (`lib/download`); multipart uploads (`lib/multipart`); `ConfirmDialog` for sensitive mutations (reverse, cancel, reconcile, approve, verify/reject, delete, publish, archive); every mutation button wrapped in `<Can tasks={[...]}>` using the SAME task codes the backend enforces (read each viewset's `get_permissions`); no new visual language (reuse `components/ui` and `components/shared`). Put new TS types in service files (avoid editing `types/models.ts`, `utils/queryKeys.ts`, `services/index.ts`).

Per-domain scope (from the user's plan):
- **People/students**: People CRUD with nested contact/address/photo/identity-document upload; Student detail with placement (Coordinator, `students.students.manage_placement`), leave periods (Registrar), Person data, finance summary, results, compliance, transcript action.
- **Compliance**: Student "My Compliance" (details, due date, lock state, history, text/file submit, rejection feedback); Admin/Registrar definitions CRUD, assign, review queue, verify/reject with notes, status filters.
- **Learning**: staff material CRUD (file/link, schedule, audience, edit/delete, publish, archive); student feed with authenticated downloads, availability messaging, safe external links (http/https only, `rel="noopener noreferrer"`).
- **Exams/gradebook/results**: Exams full CRUD + components + guarded publish; Faculty scoped DRAFT gradebook (max-mark validation, no publish controls); results verify/publish/freeze kept, plus detail, per-exam view, correction request/review/apply.
- **Transcripts**: Student-own download; staff student search, PDF, optional email, `FINANCE_BLOCKED` messaging, public verify.
- **Finance**: fee-type CRUD, fee-plan edit/deactivate/delete with typed selectors, payment record/verify/receipt PDF/reverse, voucher detail/PDF/reconcile/cancel, ledger browser, adjustments CRUD/approve, policies.
- **Notifications**: keep inbox; admin compose, audience targeting, scheduling, drafts/list/detail, send/queue.
- **Attendance**: eligibility wired to `/api/attendance/eligibility/`; backend export; detail/edit/delete where authorized; input page in nav; biometric as a staff-only integration panel.
- **Academics/timetable**: period open/close; session create/edit/delete; section detail; timetable unpublish; entry edit/delete/cancel.
- **RBAC**: live Role CRUD (system roles cannot be renamed/deleted), permission-task browser by module, role-task assignment, per-user overrides. Note for the UI: built-in role grants apply IN ADDITION to explicit assignments and cannot be removed via the UI.
- **Users**: list all 8 canonical roles. **Audit**: use backend `/api/audit/export/` and `/api/audit/{id}/`. **Imports**: job detail dialogs + error CSV download for students; a real Faculty import page.

### 6.5 Recommended way to finish (avoid a repeat of the rate limits)

Work in SMALL units, one domain at a time, verifying each before the next. If using sub-agents, run at most 2 at once and give each a narrow scope (a few pages). For each domain: review the existing draft files, run `tsc`, `eslint`, the relevant vitest files and the parity checker, write/repair tests, then flip that workflow's parity entries to `implemented` with real `tests` paths (relative to `frontend/src`; `permissions` must be real catalog codes).

---

## 7. Phase 4: tests (mostly PENDING)

Done: unit tests for access model, auth store, guard, landing map, route registry, Sidebar, shared helpers (frontend total was 180 tests, 178 passing).

Pending:
1. Vitest tests for every new/changed service and screen (permission-gated buttons, confirmation flows incl. required reason, validation errors displayed, upload/download calls, 401/403/404/error states). Existing tests that must keep passing: `services/results.test.ts`, `services/transcripts.test.ts`, `services/attendance.test.ts` (currently failing, see 6.1), `features/finance/VoucherGenerationForm.test.tsx`, dashboard tests.
2. Playwright specs for all 8 roles + public transcript verification: at least one read and one permitted-or-denied mutation per major module. Existing suite has 196 tests in 11 files. Add specs under `e2e/tests/{coordinator,finance,office}/` and extend the others. Include a landing-path test per role (`LANDING_PATH` in `e2e/data/test-data.ts`). Never commit auth state or uploaded test files.
3. Update `e2e/tests/*` that assumed the old role-string nav or the old landing behaviour.
4. Backend: optionally add tests for the new `dashboard_stats` data shapes if the frontend needs more fields.

---

## 8. Phase 5: gate, commit, deploy (NOT STARTED)

### 8.1 Isolated gate stack: DO NOT use `docker-compose.dev.yml`

It is unsafe on this shared VPS: it publishes Postgres on host port 5432 (already used by another app, `mbbsprep_postgres`), loads the PRODUCTION `.env`, and bind-mounts the same `backend/media` and `backend/staticfiles` that production uses. Instead build a disposable stack from scratch, on unused ports, touching nothing shared:

- Postgres: throwaway container on `127.0.0.1:15499` (command in 4.3), optionally restored from a production backup for realism.
- Backend: run from `backend/.venv` against that DB with a temp `MEDIA_ROOT`, its own `DJANGO_SECRET_KEY`, port e.g. 18110; `manage.py migrate` (this also proves migration 0003 on Postgres), `manage.py seed_pilot_baseline`, plus demo/timetable seed data as `.github/workflows/e2e.yml` does (read it).
- Frontend: `npm run build` then `npx vite preview`, or `npm run dev`, on e.g. 15173 with `VITE_API_URL` pointing at the backend; set `BASE_URL` for Playwright.
- Remove everything (container, temp dirs) afterwards.

Gate checklist (record results): backend ruff (on touched files) + full pytest; OpenAPI drift by the delta method (4.5) + `python3 android/scripts/check_parity_register.py`; `python3 frontend/scripts/check_web_parity.py --strict`; frontend `tsc`, `eslint`, `vitest run`, `npm run build`; full Playwright suite; verify nothing tracked or staged contains secrets, `.env`, tokens, browser auth state, built output or uploaded test docs (`git status`, `git diff --cached --stat`).

### 8.2 Commit and merge

One commit on `feat/web-parity`: `feat(web): complete backend workflow exposure`, with the trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (per the session's attribution rule). Stage files explicitly (never `git add -A`; `backups/` is untracked and must stay out). Then fast-forward merge into `main` and push (`git@github.com:munaimtahir/fmu-platform`). The user pre-authorized merge, push and deploy in the approved plan.

### 8.3 Production deploy (from `/home/munaim/srv/apps/fmu-platform`, canonical `docker-compose.yml`, `./both.sh`; never `docker-compose.prod.yml`)

The FMU stack is `vexel_medsims_*` (backend 18010, frontend 18080, public `https://sims.vexel.pk`). Other containers on the host (`pgsims_*`, `class-*`, `rims_*`, `vexel-*`, ...) are unrelated apps: never touch them.

1. Preflight: branch, HEAD, tracked changes, container state, `/api/health/`, disk (was 82% used, 27 GB free). Stop if tracked production changes conflict. Preserve untracked `backups/`.
2. Record live image IDs and commit (currently `93be5ed`). **Tag rollback images first**: `docker tag fmu-platform-backend:latest fmu-platform-backend:rollback-93be5ed` and the same for frontend (`both.sh` builds with `--no-cache` and retags `latest`). The older `rollback-5fb8d8b` tags are for the pre-hotfix state.
3. Backup: `docker exec vexel_medsims_db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backups/pre-deploy-web-parity-<timestamp>.sql.gz`, then `gzip -t` it (about 44 KB is normal; the DB is small: 60 users, 44 students).
4. **`both.sh` does NOT rebuild `vexel_medsims_rq_worker`** (its image is older). This release changes shared backend code and adds a data migration, so also rebuild and restart the worker (`docker compose -f docker-compose.yml build rq_worker` / `up -d rq_worker`, confirm the service name in the compose file) or confirm it is unaffected.
5. Run `./both.sh` (stops backend+frontend, rebuilds, migrates including `core.0003`, collectstatic, health-checks). Expect brief downtime.
6. Verify: containers and worker healthy; `curl -H 'X-Forwarded-Proto: https' http://127.0.0.1:18010/api/health/` returns status ok and `version` equals the new SHA; public frontend and `/api/health/` return 200; db/migrations/redis ok; backend, frontend and worker logs show no new exceptions; `core_permissiontask` = 179 rows.
7. Read-only UI smoke per role landing and navigation (public URL, real pilot-like accounts). Run mutation contracts ONLY inside rollback-only transactions (`docker exec -i vexel_medsims_backend python manage.py shell` with `transaction.atomic()` + `transaction.set_rollback(True)`, as done for Phase 0; use `APIClient(SERVER_NAME="sims.vexel.pk")` with `secure=True`). File uploads are NOT rolled back by the DB: use a temp `MEDIA_ROOT` and delete it. Never enqueue Redis jobs during verification. Cover: login/session restore, capability filtering, People, Compliance, Learning, Exam/gradebook, Result correction, Finance (incl. voucher cancel), Notifications, Attendance, RBAC, Audit export, Transcript download, and the previously broken links (student import, section detail, People).
8. Failure: record it first, then re-tag the saved rollback images and restart. Restore the DB backup only if the additive migration caused a database-state failure. Never leave production on a partially verified revision.

Release notes to give the user: (a) biometric ingestion is now task-gated (second authorization hole found), (b) voucher cancel refuses vouchers with live payments, (c) `/verify/:token` no longer shows the app chrome, (d) `/apply` removed, (e) learning/notifications/transcripts now use task codes with unchanged default access for existing roles (verified against real users).

---

## 9. Gotchas and repo facts

- Use `backend/.venv/bin/python`; system Python lacks dependencies. Use `MEDIA_ROOT=$(mktemp -d)` for tests.
- `has_permission_task` fallback semantics (4.3) and the ADMIN rule: ADMIN group is implicit-all ONLY when the user holds no other domain group (pilot `finance` = ADMIN+FINANCE, `registrar` = ADMIN+REGISTRAR are scoped like their domain role). Learning materials, notifications and transcripts are exceptions (`BUILTIN_ADMIN_ALWAYS_PREFIXES`) to preserve legacy non-exclusive `in_group("ADMIN")` behaviour.
- Attendance and admin-users endpoints still use group/session checks rather than tasks; their routes therefore use `roles` (OR `tasks`) in `routeAccess.ts`.
- `backend/.../legacy` ProgramCoordinator group spellings were accepted by the old `IsNotificationAdmin` but are not present in production; ignored.
- All CI workflows are `workflow_dispatch` only; that is by the user's decision, not an oversight.
- Memory notes for future sessions live in `/home/munaim/.claude/projects/-home-munaim-srv-apps-fmu-platform/memory/`. Update the schema-generation note: **the Postgres-engine env var method (4.5) works**, contrary to the note's older wording.
- Scratch helper scripts (register generator, verification script) lived in the session scratchpad and are gone. The register JSON is now the source of truth; edit `frontend/parity/workflows/*.json` directly. The real-user verification is described in 4.3 and easy to recreate.
- User-facing summary they have already seen: Phase 0 is live; all five Phase 3 workers were interrupted by rate limits.

---

## 10. Suggested order of work for the next agent

1. `git status` / `git diff --stat` to orient; run the four frontend checks and the backend tests to confirm the state described here.
2. Fix 6.1 (3 type errors, 2 failing attendance tests, 1 parity violation).
3. Finish the 4 skeleton pages (6.2).
4. Domain by domain (6.5): review the unverified drafts, complete missing pieces (see 6.3 "NOT observed"), add tests, flip parity entries to `implemented`.
5. Playwright specs for 8 roles (section 7).
6. Run the isolated gate (8.1), fix failures.
7. Single commit, merge, push, deploy, verify (8.2, 8.3).
8. Report to the user: what shipped, the two authorization holes, the extra voucher guard, and any deviations.
