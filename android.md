# Android Feature-Parity Roadmap

## 1. Purpose & source of truth

This document is the human-readable roadmap for bringing the Android app (`android/`) to full feature parity with the web frontend (`frontend/`), using the **same production Django backend** (`backend/sims_backend/`) as the single source of business logic and data.

It is **not** the enforcement mechanism. That is:
- [`android/parity/register.json`](android/parity/register.json) — machine-validated registry of every in-scope role workflow, its API contract, mutation types, and Android model/test artifacts.
- [`android/scripts/check_parity_register.py`](android/scripts/check_parity_register.py) — runs in Android CI, fails the build if the Android OpenAPI snapshot drifts from `docs/openapi-schema.yaml`, or if a registered workflow's paths/artifacts go stale, or if a Retrofit endpoint exists without a matching register entry.
- [`android/docs/PARITY_MATRIX.md`](android/docs/PARITY_MATRIX.md) — thin pointer doc summarizing register status per domain.

`android.md` exists to give a full picture across all three codebases (backend, web, Android) in one place, sequence the remaining work into stages, and record what's already built. Whenever this document and `register.json` disagree, **`register.json` wins** — update this file to match, not the other way around.

## 2. Architecture summary

- **One backend, one contract.** Android talks to the same REST API as the web app (`/api/...`), authenticated the same way — JWT via `rest_framework_simplejwt`, access/refresh tokens, `/api/auth/login|refresh|me|change-password|logout/`. No separate mobile auth scheme.
- **Curated mobile reads.** A small `sims_backend.mobile` app already exists at `/api/mobile/*` ("Student Read API Freeze 01") providing pre-shaped home/timetable views for Student. Every other role currently consumes the same general-purpose API the web app uses — there is no curated `/api/mobile/*` surface for Faculty/Registrar/Coordinator/ExamCell/Finance/Admin yet. Each future phase should decide per-workflow whether a curated mobile endpoint is worth adding or whether the general API is sufficient.
- **Online-only, no offline writes.** Policy recorded in `register.json` (`"offline_writes": "forbidden"`). No Room DB, no local write queue. All mutations go straight to the API; failures surface as errors, not queued for retry. This plan does not change that policy.
- **Explicitly out of Android scope** (per `register.json.policy.excluded_workflows`): public student intake/application flow, public QR/token transcript verification, and internal demo/style-guide routes. These exist on web but should not be built for mobile unless product explicitly asks.
- **No new UI capabilities planned beyond web parity.** The web app itself has no charting library, no rich text editor, no camera capture, and no offline support — so Android does not need to invent these either, except where a workflow is mobile-native by nature (e.g., using the camera to snap a compliance document, which would be a deliberate *enhancement*, not parity, and should be called out separately if pursued).
- **Stack:** Kotlin + Jetpack Compose, Hilt DI, Retrofit/OkHttp, adaptive layout (NavigationRail vs. bottom bar), shared `NetworkResult`/`safeCall` error-handling pattern used by every repository.

## 3. Full feature inventory

Status values: **Implemented**, **Implemented-with-gaps**, **Planned**, **Out-of-scope**.

| Role / Area | Web capability | Backend API(s) | Android release train | Status |
|---|---|---|---|---|
| Cross-cutting | Login, JWT refresh, logout, "me" | `/api/auth/login,refresh,me,logout/` | `student` (foundation, reused by all roles) | **Implemented** |
| Cross-cutting | Profile view/update, change password | `/api/auth/me/`, `/api/auth/change-password/` | `student` | **Implemented** |
| Cross-cutting | Notifications inbox, mark read/all, unread count | `/api/my/notifications/*` | `student` | **Implemented** |
| Cross-cutting | Admin impersonation ("become user") | `/api/admin/impersonation/start,stop/` | `admin` | **Implemented** |
| Student | Dashboard home | `/api/mobile/student/home/` | `student` | **Implemented** |
| Student | Timetable | `/api/mobile/student/timetable/` | `student` | **Implemented** |
| Student | Attendance record view | `/api/attendance/` | `student` | **Implemented** |
| Student | Results view | `/api/results/` | `student` | **Implemented** |
| Student | Fee summary (self) | `/api/finance/students/{id}/` | `student` | **Implemented** |
| Student | Learning materials feed | `/api/learning/student-feed/` | `student` | **Implemented** (authenticated download + system viewer) |
| Student | Compliance requirements + text/document submission | `/api/compliance/my-compliance/*` | `student` | **Implemented** |
| Student | Fee statement PDF download | `/api/finance/students/{id}/statement/pdf/` | `student` | **Implemented** |
| Student | Public application / admission form | n/a | — | **Out-of-scope** |
| Student | Public QR/token transcript verification | `/api/transcripts/verify/{token}/` | — | **Out-of-scope** |
| Faculty | Dashboard/stats | `/api/dashboard/stats/` | `faculty` | **Implemented** (staged behind v1.1.0 release flag) |
| Faculty | Section roster / live attendance input | `/api/attendance-input/live/roster,submit/` | `faculty` | **Implemented** (staged behind v1.1.0 release flag) |
| Faculty | Scoped draft results/gradebook entry | `/api/results/`, `/api/result-components/` | `faculty` | **Implemented** |
| Faculty | Learning materials and section audiences | `/api/learning/materials/`, `/api/learning/audiences/` | `faculty` | **Implemented** |
| Registrar | Student/people records CRUD | `/api/students/`, `/api/people/*` | `registrar-coordinator` | **Implemented** |
| Registrar | Academics lifecycle (programs/batches/periods/groups/departments) | `/api/academics/*` | `registrar-coordinator` | **Implemented** |
| Registrar | Timetable CRUD/generation/publication | `/api/timetable/weekly-timetables/*`, `/api/timetable/entries/*` | `registrar-coordinator` | **Implemented** |
| Coordinator | Bulk student import | `/api/admin/students/import/*` | `registrar-coordinator` | **Implemented** |
| Coordinator | Attendance eligibility report | `/api/attendance/eligibility/` | `registrar-coordinator` | **Implemented** |
| ExamCell | Exam management + publish | `/api/exams/*` | `exam-finance` | **Implemented** |
| ExamCell | Result publication / correction workflow | `/api/results/`, `/api/result-corrections/` | `exam-finance` | **Implemented** |
| ExamCell | Transcript generation (internal, authenticated) | `/api/transcripts/{student_id}/` | `exam-finance` | **Implemented** |
| Finance | Fee plans, vouchers, payments, ledger, adjustments | `/api/finance/*` | `exam-finance` | **Implemented** |
| Finance | Reports (defaulters/collection/aging) + statement PDF | `/api/finance/reports/*` | `exam-finance` | **Implemented** |
| Admin | User management, role/permission assignment | `/api/admin/users/*`, `/api/core/roles/*` | `admin` | **Implemented** |
| Admin | Audit log (+ export) | `/api/audit/*` | `admin` | **Implemented** |
| Admin | System settings, syllabus manager | `/api/admin/settings/*`, `/api/admin/syllabus/*` | `admin` | **Implemented** |
| Analytics | Aggregated admin analytics dashboard | `/api/admin/dashboard/` | `admin` | **Implemented** (stat-tile/detail payload; no charts) |

## 4. Staged development plan

Phases follow the release-train sequence already committed to in `register.json`: **student → faculty → registrar-coordinator → exam-finance → admin**. This plan does not reorder that sequence — it adds concrete next steps and web/backend cross-references per phase.

### Phase 0 — Foundation (done)
Session/auth (`core/auth/AuthRepository.kt`, `SessionViewModel.kt`), adaptive shell/navigation (`feature/shell/`), shared error handling (`core/network/NetworkResult.kt`), Hilt DI wiring, CI parity gate. Reused by every later phase — no further action needed unless a later phase surfaces a gap in this layer.

### Phase 1 — Student (implemented; v1.0.4 uploaded)
- Document upload/download, fee statement PDF retrieval, authenticated learning-file handling, and the reusable system-viewer handoff are implemented.
- `StudentServicesScreen`, its API contract, and `ProfileViewModel` now have registered automated coverage.
- The v1.0.4 Play upload and external upload-key backup were confirmed by the operator; the production demo login and Student role-home smoke also pass.

### Phase 2 — Faculty (`faculty-delivery` in register, implemented)
- Implemented and tested: Faculty stat tiles, own-session selection, searchable roster, present/absent controls, confirmation, live attendance submission, scoped draft gradebook entry, component marks, and learning-material file/link management with teaching-section audiences.
- Enabled for debug and release builds in v1.1.0 after the Student-only v1.0.4 upload.
- Faculty result access is restricted to matching taught group/academic-period pairs. Faculty may create and edit drafts; ExamCell retains verify/publish/freeze authority.

### Phase 3 — Registrar/Coordinator (implemented for v1.2.0)
- Screens: student/people record CRUD, academics lifecycle management (programs/batches/periods/groups/departments), timetable publication, bulk student import, attendance eligibility report.
- Bind to `/api/students/`, `/api/people/persons/`, `/api/academics/*`, `/api/timetable/weekly-timetables/*`, `/api/admin/students/import/*`, `/api/attendance/eligibility/`.
- CRUD/table-heavy web surfaces use searchable, paginated mobile cards and typed detail/edit dialogs rather than wide table ports.

### Phase 4 — ExamCell/Finance (implemented for v1.2.0)
- Screens: exam management + publish workflow, result publication/correction, internal transcript generation (authenticated — not the public QR flow), finance dashboard, vouchers, payments, ledger, adjustments, reports, statement PDF.
- Bind to `/api/exams/*`, `/api/results/`, `/api/result-corrections/`, `/api/transcripts/{student_id}/`, `/api/finance/*`.
- Sensitive Finance writes use explicit confirmations and backend task authorization; contract/regression coverage and production role smokes verify server-side enforcement.

### Phase 5 — Admin (implemented for v1.2.0)
- Screens: user management, role/permission assignment, audit log (+export), impersonation, system settings, syllabus manager, analytics dashboard (stat-tile style, matching web's non-chart approach).
- Bind to `/api/admin/*`, `/api/core/roles/*`, `/api/audit/*`.
- Impersonation uses the web-equivalent backup/restore token pattern, prevents nesting, displays a persistent acting-as banner, and restores the Admin session on stop.

Each phase's Definition of Done: screens implemented, `register.json` workflow entry updated from `planned` to `implemented` (or `implemented-with-gaps` with a stated reason), unit + Compose UI tests added, `check_parity_register.py` passes in CI.

## 5. Status audit (as of this document's creation)

Source: direct inspection of `android/parity/register.json`, `android/docs/PARITY_MATRIX.md`, and the Android source tree.

- ✅ **Auth/session foundation** — `core/auth/AuthRepository.kt`, `SessionViewModel.kt`, `SessionStore.kt`, `TokenRefresher.kt`. Register: `student-session-foundation` = implemented.
- ✅ **Home/timetable/attendance/results (read)** — `feature/home/HomeScreen.kt`, `feature/timetable/TimetableScreen.kt`, `feature/attendance/AttendanceScreen.kt`, `feature/results/ResultsScreen.kt`, each with a ViewModel and unit test. Register: `student-home` = implemented.
- ✅ **Profile/account** — `feature/profile/ProfileScreen.kt` + `ProfileViewModel.kt`. Register: `student-account` = implemented.
- ✅ **Student services (fees/learning/compliance/notifications)** — supports authenticated downloads, system-viewer handoff, compliance document upload, fee statements, notifications, and registered tests. Register: `student-fees-learning-compliance` = implemented.
- ✅ **Faculty** — dashboard, own sessions, live attendance, scoped draft gradebook, component marks, and learning-material file/link/audience lifecycle are implemented and tested. Register: `faculty-delivery` = implemented.
- ✅ **Registrar** — native mobile record CRUD, academic lifecycle, timetable entries/generation/publication. Register: `registrar-coordinator-records` = implemented.
- ✅ **Coordinator** — placement, CSV preview/commit/jobs/errors and eligibility. Register: `coordinator-records` = implemented.
- ✅ **ExamCell** — exams/components, result lifecycle/corrections and authenticated transcripts. Register: `exam-cell-results` = implemented.
- ✅ **Finance** — fee configuration, bulk vouchers, payments, ledger, adjustments, reports and documents. Register: `finance-operations` = implemented.
- ✅ **Admin** — dashboard, users/RBAC, audit/export, settings, syllabus and guarded impersonation. Register: `admin-governance` = implemented.
- **Infrastructure:** Hilt DI, Retrofit/OkHttp networking (`core/network/`), adaptive shell/navigation, shared `NetworkResult`/`safeCall` error pattern, unit + instrumented test scaffolding, CI workflow (`android-ci.yml`, unit tests/lint/assemble/instrumented tests across API 28/34/tablet — no signing/upload) — all ✅ in place and reusable by every future phase.
- **Release status:** Student-only v1.0.4 was uploaded and the upload key was backed up. The complete Faculty and Phase 3–5 implementation is included in the refreshed v1.2.0 candidate (versionCode 6). Per operator direction, no version bump or Play upload is required while that candidate remains unsubmitted.

## 6. Open gaps / risks

- **Offline-write policy vs. field usage:** all staff writes remain deliberately online-only. Reconsidering offline mutation support is a future product-policy decision, not a Phase 3–5 implementation gap.
- **Mobile-curated API coverage:** Student uses curated `/api/mobile/*`; staff roles intentionally consume the same typed/general REST contracts as the web application.
- **Wide web tables → mobile:** Registrar/Coordinator and Admin CRUD is implemented as searchable, paginated mobile cards with typed edit/action dialogs.
- **Finance write sensitivity:** payment/adjustment/reversal/approval flows retain explicit client confirmation and backend task authorization; dedicated tests and production role acceptance passed.
- **Document viewing on mobile:** authenticated documents are streamed to app-private cache and handed to the system viewer through `FileProvider`; the pattern is reused by statements, receipts, vouchers, transcripts and CSV exports.
