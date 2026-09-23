# Student Onboarding Implementation Plan

**Status:** Implementation and local regression verification complete; deployment smoke acceptance remains a release step

**Date:** 2026-09-21

**Source contract:** `STUDENT_ONBOARDING_WORKFLOW.md`

## 1. Delivery Objective

Implement the approved staff-provisioned student onboarding workflow from CSV import through mandatory first-password change, incremental profile completion, document collection, student reminders, and administrative monitoring.

The application has no real or production student data. Development, demo, and test data are disposable. Implementation may use clean schema changes, replace the existing student import behavior, and reset non-production databases. Do not build data backfills, legacy adapters, dual-write paths, or backward-compatibility shims.

## 2. Finalized Product and Technical Decisions

These decisions close the open items identified during workflow review.

### 2.1 Provisioning invariant and data ownership

One successful provisioning operation creates, in one database transaction:

- one Django `User`;
- one `Person` linked to that User;
- one `Student` linked to that User and Person;
- the canonical `STUDENT` role membership;
- academic placement;
- required onboarding-compliance instances;
- first-login security state.

The relationship is mandatory and one-to-one. Student, User, and Person records must not be independently created or hard-deleted through supported APIs.

Canonical field ownership is:

| Data | Canonical owner | Student self-edit |
|---|---|---|
| Username/login identifier | `User.username`, equal to normalized `Student.reg_no` | No |
| Registration number | `Student.reg_no` | No |
| Program, Batch, Group, academic status | `Student` | No |
| First, middle, and last name | `Person` | No; staff correction only |
| Date of birth and gender | `Person` | Yes until staff verification policy is added |
| Email and mobile number | primary `ContactInfo` records | Yes |
| Residential address | primary `Address` record | Yes |
| Guardian/emergency contact | dedicated `EmergencyContact` record | Yes |
| Required onboarding documents | compliance requirement/submission models | Upload/replace own submissions |
| Authentication password | Django password hash | Change through password endpoint only |

Remove the duplicated `Student.name`, `Student.email`, `Student.phone`, and `Student.date_of_birth` storage. Expose display values through serializers from the canonical related models and update all consumers.

### 2.2 Registration-number rules

Normalize every registration number before validation or lookup:

1. Unicode NFKC normalization.
2. Trim outer whitespace.
3. Convert to uppercase.
4. Require `^[A-Z0-9][A-Z0-9._/-]{0,31}$`.

Use the normalized value for both `Student.reg_no` and `User.username`. Enforce case-insensitive uniqueness at the database and service layers. Login applies the same normalization before authentication. Registration numbers and student usernames are immutable after provisioning.

### 2.3 CSV contract

The final student template uses IDs for academic structures so resolution is deterministic.

Required columns:

- `first_name`
- `last_name`
- `registration_number`
- `program_id`
- `batch_id`
- `initial_password`

Optional columns:

- `middle_name`
- `group_id`
- `email`
- `mobile_number`
- `date_of_birth`
- `gender`

Program and Batch must exist and be active. Batch must belong to Program. Group, when supplied, must exist, be active if that concept is available, and belong to Batch. New students start with academic status `active`; status is not import-controlled.

The import is create-only and idempotent:

- `CREATE`: the normalized registration number exists in neither Student nor User.
- `UNCHANGED`: an already linked Student/User/Person triple exists and all imported identity and placement values match.
- `REJECT`: any collision, mismatch, invalid relationship, invalid password, or invalid field.
- There is no UPSERT mode. Changes after provisioning use permission-controlled administration.

Valid rows commit even when other rows are invalid. Each row uses its own atomic savepoint. A job can be committed only by its creator. Job commit uses a row lock; retrying an already committed job returns its stored result without writing again.

### 2.4 Password-bearing file and credential handling

The backend does not retain the uploaded source CSV.

- Preview accepts the file, calculates its hash, validates it, stores only sanitized preview metadata, and discards the file.
- Preview responses replace `initial_password` with a fixed redacted marker and never include its value.
- Commit requires the browser to upload the file again with the job ID. The hash must match the previewed hash.
- Commit revalidates the complete file, uses passwords only as write-only inputs to `set_password`, and discards request data after processing.
- Error rows, downloadable reports, audit events, exception details, and application logs must omit the password column and value.
- Django password validators apply to every initial and reset password.

Credential delivery is an explicit manual first-release process: authorized staff create the temporary password in the source CSV and communicate it to the student through the institution's approved offline channel. The platform does not display or return the initial password.

For an administrative reset, the authorized staff member supplies and confirms a temporary password in the reset form. The API accepts it as write-only input, hashes it, returns no password, sets password change required, increments the student's credential version, and audits the reset without sensitive values. Automatic password generation and email/SMS delivery remain out of scope.

### 2.5 Onboarding state model

Persist only security state needed for enforcement:

- `password_change_required: bool`, initially `true`;
- `credential_version: positive integer`, initially `1`.

Calculate profile and document state through one backend onboarding-completion service. Return this contract to both student and administrative clients:

```json
{
  "password_change_required": true,
  "profile_status": "incomplete",
  "documents_status": "pending",
  "primary_state": "password_change_required",
  "profile_completion_percentage": 78,
  "missing_fields": ["date_of_birth", "gender"],
  "missing_sections": ["personal_identity"],
  "missing_documents": [{"requirement_id": 4, "title": "CNIC copy"}]
}
```

`primary_state` uses this precedence:

1. `password_change_required`
2. `profile_incomplete`
3. `documents_pending`
4. `complete`

Password reset changes only the password requirement and credential version; it does not erase completed profile or document work.

The profile percentage is backend-calculated as completed required profile items divided by total required profile items, rounded to the nearest whole number. Documents are excluded and reported separately. The initial required items are first name, last name, date of birth, gender, primary mobile, primary email, residential address, emergency-contact name, and emergency-contact phone. Imported first and last names begin complete.

### 2.6 Document requirements

Use the compliance module for onboarding document requirements and submissions. Do not use `IdentityDocument` as the generic onboarding-document store.

Add requirement scopes with three types:

- `GLOBAL`: applies to every student;
- `PROGRAM`: applies to one Program;
- `BATCH`: applies to one Batch.

Effective requirements are the union of active global, program, and batch scopes; narrower scopes do not override broader scopes. A required document is satisfied for onboarding when its active instance is `submitted` or `verified`. `pending` and `rejected` remain incomplete. Scope and placement changes deactivate obsolete automatic instances without deleting submissions or review history. Manual assignments remain manual; when they match an active scope they also count toward onboarding.

### 2.7 Access enforcement and deletion policy

Mandatory password change is enforced by the backend for every authenticated API request. While required, permit only login/token refresh, current-user/session context, password change, and logout. All normal student APIs return a stable `PASSWORD_CHANGE_REQUIRED` error.

Student JWTs include their current credential version. Password reset increments the stored version so existing student tokens become invalid. Successful mandatory password change increments the version and returns a rotated access/refresh token pair so the student can continue directly to profile onboarding.

The frontend guard is user experience, not the security boundary. It routes affected students to `/change-password-required` before evaluating normal role/task routes.

Hard deletion of linked User, Person, and Student records is prohibited. Administrative removal deactivates the User and marks the Student inactive in one service operation. The general admin User API must reject creation of a standalone `STUDENT` user, assignment of the `STUDENT` role to an unlinked User, and changes to a linked student's username.

### 2.8 Target API surface

Keep existing route prefixes where possible, but replace their contracts as follows:

- `POST /api/admin/students/import/preview/`: multipart CSV preview; returns a sanitized job and row outcomes.
- `POST /api/admin/students/import/commit/`: multipart CSV, preview job ID, and confirmation; returns the idempotent commit result.
- `GET /api/admin/students/import/template/`: final create-only template.
- `GET /api/admin/students/import/jobs/` and job detail/error routes: sanitized metadata and password-free errors only.
- `GET /api/students/me/onboarding/`: current student's canonical profile plus authoritative onboarding state.
- `PATCH /api/students/me/onboarding/profile/`: section-friendly partial profile update for permitted fields.
- `POST /api/students/me/onboarding/documents/{requirement_id}/submit/`: authenticated submission to an applicable requirement.
- `GET /api/students/{id}/onboarding/`: permission-controlled staff diagnostics.
- `GET /api/students/`: supports `onboarding_state` and existing academic filters.
- `PATCH /api/students/{id}/placement/`: staff placement update with nullable Group and requirement resynchronization.
- `POST /api/auth/change-password/`: changes the password and returns rotated tokens plus updated onboarding security state.
- `POST /api/admin/users/{id}/reset-password/`: accepts write-only temporary password and confirmation; returns status only.

Authentication and authorization errors use stable machine codes, including `PASSWORD_CHANGE_REQUIRED`, so the frontend never depends on message text.

## 3. Backend Task List

- [x] BE-01 — Establish the clean schema
- [x] BE-02 — Build the canonical provisioning service
- [x] BE-03 — Replace the student import service
- [x] BE-04 — Enforce first-login password change
- [x] BE-05 — Implement the profile and completion service
- [x] BE-06 — Implement document applicability and secure submission
- [x] BE-07 — Add administrative onboarding APIs and permissions
- [x] BE-08 — Update dependent backend consumers and exercised test fixtures

### BE-01 — Establish the clean schema

- Make `Student.user`, `Student.person`, and `Person.user` required one-to-one relationships with protective deletion behavior.
- Make `Student.group` nullable.
- Remove duplicated identity/contact fields from Student.
- Add `password_change_required` and `credential_version` to Student.
- Add `EmergencyContact` with one primary record per Person for this release.
- Add case-insensitive registration-number uniqueness and model validation.
- Add compliance requirement scope and instance-activity fields/constraints.
- Rebuild or replace migrations as appropriate for a clean non-production database.
- Update seed commands and factories to use the canonical provisioning service.

**Done when:** a clean migration creates the schema, seeds roles/tasks, and no fixture creates an orphaned student entity.

### BE-02 — Build the canonical provisioning service

- Add one service responsible for normalized identity validation and atomic User/Person/Student creation.
- Assign the existing canonical `STUDENT` group without creating role names opportunistically.
- Set the initial password with Django hashing and validators.
- Create primary contact records for supplied email/mobile data.
- Synchronize applicable onboarding document instances.
- Emit one sanitized audit event containing actor, Student/User IDs, registration number, placement IDs, and import job ID.
- Route every supported single-student or bulk creation path through this service.

**Done when:** simulated failure at each creation step rolls back the entire row.

### BE-03 — Replace the student import service

- Replace the existing template, validators, serializers, and service with the finalized CSV contract.
- Remove UPSERT and academic auto-create behavior.
- Make preview read-only except for sanitized `ImportJob` metadata.
- Remove persistent source-file storage from `ImportJob`.
- Require file re-upload and matching SHA-256 hash at commit.
- Redact passwords before constructing preview/error/audit structures.
- Implement `CREATE`, `UNCHANGED`, and `REJECT` outcomes.
- Use per-row savepoints, job ownership checks, `select_for_update`, and idempotent committed-job responses.
- Add explicit job expiry/cleanup for abandoned preview metadata.

**Done when:** preview makes no domain writes, committed rows cannot orphan entities, and no response or stored artifact contains an initial password.

### BE-04 — Enforce first-login password change

- Add onboarding security state to login/current-user/access-context responses.
- Add the student credential-version claim and validation to JWT issuance/authentication.
- Add a global authenticated-request guard with the documented endpoint allowlist.
- Update password change to clear the requirement, increment credential version, and rotate tokens atomically.
- Change admin password reset to accept a staff-supplied temporary password as write-only input, set the requirement, increment credential version, and return status only.
- Ensure impersonation cannot clear or bypass a student's mandatory-password state unless an explicit admin-only diagnostic policy is documented.

**Done when:** direct API calls—not only browser navigation—cannot access student features before password change, and reset invalidates older student tokens.

### BE-05 — Implement the profile and completion service

- Add a single service that computes required values, percentage, missing fields/sections, document status, and primary state.
- Add a self-service onboarding endpoint that reads the linked Student/Person graph.
- Add partial-update endpoints for the student's permitted Person, ContactInfo, Address, and EmergencyContact fields.
- Make registration number, names, placement, roles, flags, credential version, verification fields, and academic status read-only to students.
- Normalize empty values consistently and validate supplied fields without requiring unrelated sections.
- Return the same computed onboarding object from student and staff APIs.

**Done when:** partial saves preserve prior values and student A cannot read or mutate student B by changing request IDs.

### BE-06 — Implement document applicability and secure submission

- Add CRUD for requirement scopes under existing compliance permission tasks or narrowly scoped new tasks.
- Add a synchronization service called during provisioning and placement changes.
- Restrict student submission queries and mutations to their own active instances.
- Validate file size, allowed MIME/type, extension, and storage name.
- Serve document files through authenticated authorization checks; do not expose public predictable media URLs.
- Preserve prior submissions and audit replacement, rejection, and verification.

**Done when:** Program/Batch requirement changes produce deterministic pending lists and unauthorized media requests fail closed.

### BE-07 — Add administrative onboarding APIs and permissions

- Add onboarding-state filters to the student registry using query annotations or efficient batched calculation.
- Add a staff detail endpoint returning missing fields, sections, and documents.
- Update placement changes to accept a null Group and resynchronize requirements.
- Add explicit task codes for student import, onboarding-detail view, profile correction, credential reset, and placement management where existing tasks are too broad.
- Disable direct Student creation and hard deletion endpoints.
- Prevent standalone student-role User creation and student username changes in admin APIs.
- Audit imports, profile corrections, placement changes, resets, deactivation, and document review without sensitive values.

**Done when:** Registrar/Admin capabilities follow the task catalog and no supported administrative path violates the entity invariant.

### BE-08 — Update dependent backend consumers

- Replace uses of removed Student identity/contact columns with related Person/contact queries.
- Update dashboard, finance, results, attendance, transcript, search, notification, mobile, and export serializers/services.
- Update `select_related`/`prefetch_related` paths to avoid N+1 regressions.
- Update seed/demo commands to create students through the canonical service.
- Regenerate and validate the OpenAPI schema.

**Done when:** repository search finds no write to removed Student identity/contact fields and backend checks pass.

## 4. Frontend Task List

- [x] FE-01 — Update authentication state and mandatory-password routing
- [x] FE-02 — Rebuild the student import UI
- [x] FE-03 — Build student profile onboarding
- [x] FE-04 — Add the student dashboard reminder
- [x] FE-05 — Add administrative onboarding visibility
- [x] FE-06 — Replace password reset UX
- [x] FE-07 — Update shared types and affected screens

### FE-01 — Update authentication state and mandatory-password routing

- Extend auth types/store with `password_change_required` and credential-version-aware refreshed tokens.
- Add `/change-password-required` as an authenticated special route outside the normal dashboard shell.
- Make the global protected-route guard redirect before role/task checks.
- Build a non-dismissible password-change screen with logout only as the secondary action.
- Store rotated tokens returned after success, reload access context, and route to `/student/onboarding`.
- Handle `PASSWORD_CHANGE_REQUIRED` API errors globally by routing to the blocking screen.

**Done when:** URL entry, browser refresh, and API errors all keep the student in the mandatory flow until success.

### FE-02 — Rebuild the student import UI

- Use the new create-only CSV template and remove UPSERT and auto-create controls.
- Keep the selected `File` in component memory from preview through commit and upload it again at commit.
- Display only redacted/sanitized preview fields.
- Show CREATE, UNCHANGED, and REJECT counts and row errors.
- Require confirmation before commit and prevent duplicate clicks while the request is active.
- Update import history to omit file/password links and show idempotent results.
- Update error-report handling for the password-free schema.

**Done when:** the browser never renders a password from an API response and refreshing an uncommitted preview requires file selection again.

### FE-03 — Build student profile onboarding

- Add `/student/onboarding` with sections for personal identity, contact information, address, emergency contact, and documents.
- Prefill names and imported optional data.
- Make names and institutional/placement fields visibly read-only.
- Save each section independently through partial-update APIs.
- Support skip, resume, loading/error states, unsaved-change warnings, and accessible field errors.
- Refresh authoritative completion state after every successful save or document submission.
- Do not calculate authoritative status or percentage in the browser.

**Done when:** a student can save one section, leave, return, and see preserved values and backend-calculated progress.

### FE-04 — Add the student dashboard reminder

- Add a persistent onboarding card to the Student dashboard.
- Display primary state, backend percentage, missing sections, and missing documents separately.
- Link to `Continue profile` and document sections.
- Hide the card only when the backend reports `primary_state: complete`.
- Keep password-required behavior on the blocking route rather than in this card.

**Done when:** dashboard contents exactly reflect the onboarding API after partial completion and document changes.

### FE-05 — Add administrative onboarding visibility

- Extend student registry columns with primary state, percentage, password-changed status, and document status.
- Add filters for password change required, profile incomplete, documents pending, and complete.
- Add an onboarding panel to student detail showing missing fields/sections/documents.
- Make Group optional in create-independent remnants and placement editing; the final UI must not offer independent Student creation.
- Add the permission-controlled staff profile-correction flow.

**Done when:** authorized staff can locate and diagnose incomplete students without seeing password data.

### FE-06 — Replace password reset UX

- Replace generated-password display with temporary-password and confirmation inputs.
- Apply client-side password guidance while treating backend validation as authoritative.
- Clear password inputs immediately after submission and never place them in toasts, errors, query caches, analytics, or logs.
- Show only a success acknowledgement instructing staff to use the approved offline delivery channel.

**Done when:** neither successful nor failed reset responses echo the supplied secret.

### FE-07 — Update shared types and affected screens

- Update Student, Person, contact, import, auth, compliance, and onboarding TypeScript contracts.
- Replace reads of removed Student identity/contact fields with nested canonical values.
- Update student detail, tables, search results, attendance selectors, finance, results, transcripts, notifications, and mobile-parity contracts as applicable.
- Update route access registration and sidebar/navigation entries.

**Done when:** typecheck and production build pass without compatibility aliases for removed fields.

## 5. Implementation Code Map

| Task | Primary current code areas |
|---|---|
| BE-01 | `backend/sims_backend/students/models.py`, `people/models.py`, `compliance/models.py`, migrations, test factories |
| BE-02 | New student provisioning service, `students/imports/services.py`, seed management commands |
| BE-03 | `backend/sims_backend/students/imports/` models, serializers, validators, templates, views, and tests |
| BE-04 | `backend/core/views.py`, `core/serializers.py`, authentication classes, `admin/views.py`, JWT settings |
| BE-05 | `students/serializers.py`, `students/views.py`, `people` serializers/views, new completion service |
| BE-06 | `backend/sims_backend/compliance/`, authenticated media delivery, storage settings |
| BE-07 | `students/views.py`, `admin` APIs, `core/rbac_catalog.py`, audit services |
| BE-08 | Backend modules that read Student names/contact data, OpenAPI generation, seed commands |
| FE-01 | `frontend/src/features/auth/`, `api/auth.ts`, route guards, app routes |
| FE-02 | `pages/admin/StudentsImportPage.tsx`, `api/studentImport.ts`, import components/types |
| FE-03 | New student-onboarding page/components, profile/compliance API clients and types |
| FE-04 | `pages/dashboards/StudentDashboard.tsx` and onboarding query components |
| FE-05 | Student registry/detail pages, `features/students/`, `pages/students/` |
| FE-06 | Admin Users password-reset UI and `api/users.ts` |
| FE-07 | Shared models/services, route access, navigation, and dependent student-data screens |

## 6. Verification Task List

- [x] QA-01 — Backend tests
- [x] QA-02 — Frontend tests
- [x] QA-03 — Isolated real-backend browser acceptance; production smoke check tracked separately below

### QA-01 — Backend tests

- Model constraints and registration normalization/case-collision tests.
- Provisioning success and transaction rollback at every failure boundary.
- Preview no-domain-write and complete password-redaction tests.
- Commit hash mismatch, ownership, concurrent commit, retry, partial-success, and unchanged-row tests.
- First-login allowlist and denial tests for representative student APIs.
- Credential-version invalidation and token rotation tests.
- Own-profile object authorization and forbidden-field tests.
- Completion percentage/state-transition table tests.
- Requirement-scope union, placement resync, submission, rejection, and media authorization tests.
- Admin task-permission and invariant-bypass regression tests.

### QA-02 — Frontend tests

- Auth-store and protected-route mandatory-password cases.
- Password-change success, failure, logout, refresh, and rotated-token behavior.
- Import file re-upload, sanitized preview, row-state, and duplicate-submit cases.
- Section-level partial saves and server validation rendering.
- Dashboard reminder visibility for every primary state.
- Admin registry filters/detail diagnostics and permission-hidden actions.
- Reset form secret-clearing and non-echo tests.

### QA-03 — End-to-end acceptance scenarios

1. Staff creates Program and Batch without Group, imports one valid student, and gets one linked User/Person/Student.
2. A mixed file creates valid rows and rejects invalid rows without partial entities.
3. Recommitting the same job is idempotent; importing identical data reports unchanged.
4. No password appears in preview, network response bodies, history, errors, audit records, or downloadable files.
5. The new student can authenticate but cannot call normal APIs before changing the password.
6. Password change rotates tokens and opens onboarding.
7. The student saves one section, skips others, returns later, and sees correct progress.
8. Program/Batch documents appear separately and transition correctly after submission/rejection.
9. Admin filters locate the student and show the same missing items as the student view.
10. Password reset invalidates existing tokens and restores mandatory change without losing profile progress.
11. Placement can be saved without Group and later assigned safely.
12. Cross-student profile and document access is denied.

## 7. Implementation Sequence and Gates

### Phase 1 — Foundation

Complete BE-01, BE-02, registration normalization, role/task seeding, and dependent test factories. Reset the non-production database after the final schema is established.

**Gate:** clean migration, seed, and provisioning-service tests pass.

### Phase 2 — Secure provisioning

Complete BE-03 and FE-02, including file re-upload, redaction, row atomicity, and import idempotency.

**Gate:** import security and transaction test suite passes; no password-bearing artifact is retained.

### Phase 3 — Authentication enforcement

Complete BE-04, FE-01, and FE-06.

**Gate:** direct API and browser tests prove mandatory-password enforcement and token invalidation.

### Phase 4 — Profile and documents

Complete BE-05, BE-06, FE-03, and FE-04.

**Gate:** partial-save, completion-service, document-scope, and media-authorization tests pass.

### Phase 5 — Administrative completion

Complete BE-07, BE-08, FE-05, and FE-07.

**Gate:** registry filters, staff diagnostics, dependent consumers, OpenAPI validation, backend checks, frontend tests, typecheck, and build pass.

### Phase 6 — Acceptance and release

Run QA-03 against a freshly initialized environment. Capture the CSV template, API schema, automated test output, and screenshots of the import, password-change, onboarding, dashboard reminder, and administrative status views.

**Release gate:** all workflow acceptance criteria and all twelve end-to-end scenarios pass with no critical or high-severity security findings.

## 8. Definition of Done

The workflow is implemented only when:

- all backend and frontend tasks above are complete;
- the supported system cannot create a standalone student-role User, unlinked Student, or unlinked student Person;
- mandatory password change is enforced by backend authorization;
- import and reset secrets are write-only and absent from retained/output artifacts;
- profile and document status comes from one backend service;
- student and administrative views report consistent state;
- a clean database initializes without legacy data or compatibility code;
- automated backend, frontend, and end-to-end acceptance suites pass.

## 9. Completion evidence and deployment handoff — 2026-09-21

The workflow is wired through Student Import, mandatory password change, Profile
Onboarding navigation, dashboard reminders, student directory filters/detail,
staff profile/status/placement controls, password reset, and Compliance review.
Configuration lives in **Compliance → Onboarding rules**, not System Settings.
Retired generic student writes and student create/delete task codes are removed;
document history cannot be hard-deleted through the compliance API.

Additional closure work includes complete paginated rule/placement choices,
private document/report storage, hourly import retention in default/production
Compose, atomic credential/review changes, and fresh profile/status responses.

### Local verification

- Backend regression suite plus onboarding and admin tests passed.
- Fresh-database migrations passed; `makemigrations --check --dry-run` found no drift.
- Django system checks passed and OpenAPI validation reported zero errors.
  Remaining schema warnings concern shared status-enum naming and existing decimal bounds.
- Default and production Compose configuration validation passed.
- Development Compose configuration validation passed as well.
- Frontend type checking and the configured lint command passed. The full web
  test run passed 191 tests; the two new notification/password-gate tests also
  passed separately. These are test outcomes, not coverage percentages.
- Final production frontend build passed. The isolated onboarding/admin suite
  also passed after making its Faculty-role fixture independent of other suites.
- Browser acceptance passed: mixed-validity import, sanitized preview/history,
  mandatory password change, resumable section saves, protected download,
  rejection/replacement/verification, complete profile and dashboard reminder,
  nullable-Group placement, staff correction, and reset with preserved progress
  and old-token rejection.
- Acceptance screenshots are written to `frontend/test-results`; failures retain traces.
- `npm run e2e:onboarding` and the manually triggered **Student Onboarding Acceptance**
  CI workflow reproduce the isolated test without using application databases.

### Production deployment evidence — 2026-09-21

- [x] Backed up the live database to
  `backups/pre-onboarding-20260921-113849.sql.gz` and verified its gzip integrity.
- [x] Rebuilt and recreated backend, frontend, worker, and `import-retention`.
- [x] Applied `compliance.0002`, `people.0003`, and
  `students.0007_student_onboarding_foundation`; Django checks pass.
- [x] Seeded the current RBAC task catalog (five task records and nine default
  assignments were added) and confirmed all onboarding/import tasks exist.
- [x] Confirmed private media is mounted at `/app/private_media` with mode 700;
  the public API cannot fetch protected import routes without authentication.
- [x] Restarted the retention service after migration; its clean startup reports
  `Expired 0 preview(s); removed 0 error file(s).`
- [x] Confirmed backend, worker, frontend, database, Redis, and retention are up;
  local and public HTTPS `/api/health/` endpoints report `status: ok`.
- [x] Confirmed public frontend HTTPS serves HTTP 200.

The live database contained only legacy/demo student records that could not satisfy
the new mandatory User/Person invariant. In line with the agreed no-real-data/no-
backward-compatibility decision, the deployment removed 44 invalid student/demo
records, six linked demo accounts, and their dependent demo attendance, finance,
and result rows in a verified transaction. The backup above is retained.

The deployment was built from the current uncommitted onboarding workspace; the
health endpoint therefore still reports the prior Git SHA as its version marker.
Commit the deployed workspace before the next deployment to restore immutable
revision tracking.
