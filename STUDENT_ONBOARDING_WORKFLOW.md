# Student Onboarding Workflow

**Status:** Implemented; legacy test-fixture migration and deployed end-to-end acceptance remain

**Date:** 2026-09-21

**Purpose:** Product and engineering contract for agents planning or implementing student onboarding in Vexel MedSIMS.

**Data baseline:** The application does not yet contain real or production student data. Existing development, demo, and test records are disposable. Student onboarding may therefore introduce clean schema changes and reset or rebuild non-production data as needed; backward compatibility with existing student records, import formats, or onboarding behavior is not required.

**Implementation plan:** `STUDENT_ONBOARDING_IMPLEMENTATION_PLAN.md`

## 1. Goal

Provide a simple, controlled onboarding process in which institutional staff provision every student from an approved list, and each student completes their own profile after first login.

The core invariant is:

> One imported student atomically creates one Student profile, one linked Person record, and one linked User account. These records must never be created independently.

There is no public student signup and no separate student-account creation workflow.

## 2. Canonical Workflow

1. An authorized administrator creates the Program and Batch. A Group/Section may be created and assigned now or later.
2. An authorized administrator uploads a CSV containing the students admitted to that Program and Batch.
3. The system validates the entire file and presents a password-safe preview.
4. On commit, each valid row atomically creates:
   - the Student profile;
   - the canonical Person identity record;
   - the linked authentication User;
   - membership in the canonical `STUDENT` role/group;
   - the academic placement supplied by the import;
   - applicable onboarding document requirements;
   - the first-login and profile-completion state.
5. The student logs in with their registration number and initial password.
6. Before accessing the rest of the student application, the student must change the initial password. Password change cannot be skipped.
7. The student enters the profile onboarding screen and may complete personal details and upload documents.
8. Profile fields and documents may be saved incrementally. The student may skip incomplete sections and return later.
9. The student dashboard displays a persistent reminder, completion percentage, and missing sections until the required profile data is complete.
10. Authorized staff can filter students by onboarding state and inspect the fields or documents missing from an incomplete profile.

## 3. Import Contract

### Required columns

- `first_name`
- `last_name`
- `registration_number`
- `program_id`
- `batch_id`
- `initial_password`

Program and Batch IDs must identify existing active records, and the Batch must belong to the Program. The import must not create academic structures during preview or commit.

### Optional columns

The import may accept:

- `middle_name`
- `group_id`
- `email`
- `mobile_number`
- `date_of_birth`
- `gender`

Missing optional values do not invalidate an import row. Group is optional at onboarding and may be assigned later by authorized staff.

### Identity and validation rules

- Registration number is normalized using Unicode NFKC, trimmed, uppercased, and validated against `^[A-Z0-9][A-Z0-9._/-]{0,31}$`.
- The normalized registration number is the student's username and immutable institutional identifier.
- Registration number must be unique across Student profiles and User accounts.
- Duplicate registration numbers within the same file are rejected.
- Existing account/profile mismatches are rejected and reported for manual resolution.
- Program and Batch IDs must resolve unambiguously, and the Batch must belong to the Program.
- If Group is supplied, it must belong to the selected Batch.
- Import preview performs validation only. It must not create Programs, Batches, Groups, Students, or Users.
- Commit requires the same file to be uploaded again, verifies its hash against the preview job, and revalidates it before writing.
- User, Person, Student, role, placement, and requirement creation is atomic per row. If any part fails, none of the row is retained.
- Import results distinguish created, rejected, and unchanged rows and provide actionable errors.
- The import is create-only: an exact existing linked record is unchanged, while collisions or differing data are rejected for administrative resolution.
- Valid rows may commit when other rows are rejected. A committed job is idempotent and cannot write twice.

### Password handling

- The CSV initial password is temporary.
- Passwords are accepted only as write-only input and are hashed by Django immediately.
- Plain-text passwords must never appear in API responses, previews, import history, error reports, audit logs, application logs, or exports.
- The backend must not persist the source CSV. Preview stores only its hash and sanitized metadata; commit receives the same file again and discards it after processing.
- Every newly provisioned account starts with password change required.
- Authorized staff communicate the temporary password through the institution's approved offline channel. Automated delivery is outside the first implementation.
- Password reset accepts a staff-supplied temporary password as write-only input, returns no password, invalidates existing student tokens, and restores password-change-required state.

## 4. Account and Profile Rules

- A User in the student role must have exactly one linked Student profile.
- A Student profile must have exactly one linked User account.
- A Student and its User must share exactly one linked Person record containing canonical identity data.
- Student account provisioning occurs only through the canonical student import service. Any retained single-student admin UI must call that same service and require the same fields and invariants.
- Public signup, self-registration, and independent creation of student-role users are outside this workflow.
- Existing non-student staff user management remains separate.
- The registration number is used to log in. Email may be added later and remains contact data rather than the primary institutional identifier.

## 5. First Login and Access Control

After successful authentication, routing and API authorization must evaluate the account's first-login state.

### Password change required

- Redirect the student to the password-change screen.
- Permit only authentication/session operations, logout, and password change.
- Do not permit navigation to student features until the password has been changed successfully.
- After password change, clear the first-login requirement and route the student to profile onboarding.

### Profile incomplete

- Permit normal student access after the password has been changed.
- Route the first post-password-change visit to profile onboarding.
- Allow the student to skip the profile form, save partial progress, and return later.
- Show the persistent dashboard reminder until required profile data is complete.

First-login enforcement must be server-backed. Frontend redirects alone are insufficient.

## 6. Profile Onboarding

The form should be divided into clear sections:

- Personal identity
- Contact information
- Address
- Guardian or emergency contact
- Previous education, where required
- Documents

The form supports partial updates and must preserve previously saved values. Validation should reject invalid values that are supplied without requiring unrelated empty sections to be completed.

### Completion policy

Profile completion and document completion are related but distinct:

- `password_change_required`: a persisted security flag indicating that a temporary password is still active.
- `profile_status`: a backend-derived value of `incomplete` or `complete`.
- `documents_status`: a backend-derived value of `pending` or `complete`.
- `primary_state`: a derived display/filter value using this precedence: `password_change_required`, `profile_incomplete`, `documents_pending`, then `complete`.

Document status may be pending while profile status is complete. Missing optional documents do not prevent profile completion. Password reset changes only the password requirement; it does not erase completed profile or document work.

The implementation plan must define a single backend completion service used by student and admin APIs. The frontend must not independently calculate authoritative status.

### Initial required profile information

Unless the existing canonical person/contact models impose a stronger requirement, planning should treat these as the initial required fields:

- first name and last name, prefilled from import;
- date of birth;
- gender;
- mobile number;
- email address;
- residential address;
- guardian or emergency contact name;
- guardian or emergency contact phone.

Document requirements are implemented through the compliance module and may be scoped globally, by Program, or by Batch. Effective requirements are the union of all applicable active scopes. Submitted or verified documents satisfy onboarding presence; pending or rejected requirements remain incomplete.

## 7. Student Experience

The student dashboard must show a persistent profile card while onboarding work remains. It should include:

- current onboarding state;
- profile completion percentage;
- missing profile sections;
- missing required documents, shown separately;
- a clear `Continue profile` action.

The reminder disappears only when the profile is complete and no reminder-worthy requirement remains. Password-change enforcement uses a blocking screen rather than this reminder.

## 8. Administrative Experience

The student registry must expose:

- onboarding status;
- profile completion percentage;
- password-changed status without exposing password data;
- document status;
- filters for password change required, profile incomplete, profile complete, and documents pending.

Selecting an incomplete status must show which sections, fields, or required documents are missing. Authorized staff may update academic placement and reset a student's password through existing permission-controlled administration. A password reset should restore the first-login password-change requirement.

## 9. Authorization and Audit

- Only appropriately permissioned administrative roles may import students or inspect onboarding details across students.
- Students may read and update only their own permitted profile fields and documents.
- Students may not change registration number, Program, Batch, Group, role, onboarding flags, or administrative verification data.
- Imports, account provisioning, password resets, placement changes, and staff profile edits must create audit records without sensitive values.
- File and document access must use the existing authenticated media/security pattern and must not expose predictable public URLs containing identity documents.

## 10. Current-System Reconciliation

An implementation-planning agent must inspect the current branch before proposing edits. At the time this workflow was approved, the repository had these known differences from the target behavior:

- Student CSV import already has preview and commit phases and creates linked users, but its username/password generation and failure handling do not meet this contract.
- The existing individual Student form can create a Student without a linked User.
- Student-to-User and Student-to-Person relationships are currently nullable.
- Import preview can create missing academic entities when auto-create is enabled; target preview must be read-only.
- Existing profile information is split between the Student model and normalized people/contact models.
- Password change exists, but first-login enforcement and a mandatory password-change flag are not established.
- Admin password reset currently returns a temporary password; the target workflow must also restore first-login enforcement.
- The earlier public intake/admissions surface is not part of this onboarding workflow.

These differences describe code that must be reconciled, not production data that must be preserved. Prefer a clean implementation of this contract over compatibility adapters, legacy import support, or data backfills. Development, demo, and test data may be reset and recreated against the final schema.

Do not assume historical freeze or audit documents describe the current working tree. Use current models, migrations, API routes, frontend routes, and tests as implementation truth.

## 11. Planning Requirements

Any implementation plan based on this document must cover:

- schema changes and a clean database initialization/reset path;
- a single atomic account/profile provisioning service;
- import template, preview, commit, and error-report changes;
- first-login enforcement in backend authorization and frontend routing;
- student partial-profile APIs and document upload behavior;
- backend-owned completion calculation;
- student reminders and admin status/filter interfaces;
- removal or reconciliation of independent student/user creation paths;
- audit, permissions, media privacy, and password handling;
- removal or replacement of legacy onboarding behavior without backward-compatibility shims;
- focused backend, frontend, and end-to-end tests;
- deployment sequencing, migration verification, and rollback considerations.

## 12. Acceptance Criteria

The workflow is complete when all of the following are true:

1. An administrator can import a valid student list after Programs and Batches exist.
2. Every successful row creates exactly one linked Student, Person, and student User.
3. Invalid rows create none of the linked Student, Person, or User records and return a useful error.
4. No supported path creates an unlinked Student, an unlinked student Person, or a standalone student-role User.
5. Registration number is unique and works as the login identifier.
6. Initial passwords never appear in output, logs, history, or downloadable reports.
7. A new student cannot access normal student features before changing the initial password.
8. After changing the password, the student can save, skip, and resume an incomplete profile.
9. Profile completion is calculated consistently by the backend.
10. The dashboard reminder accurately reports remaining profile work.
11. Admins can filter incomplete students and see what is missing.
12. Required documents can vary by Program or Batch and are reported separately from profile fields.
13. Password reset re-enables mandatory password change.
14. A clean database can be initialized with the final schema, permissions, roles, and onboarding configuration without relying on legacy student data or compatibility paths.

## 13. Out of Scope

- Public admissions applications and applicant approval workflows
- Public student signup or social login
- Automatic email/SMS credential delivery in the first implementation
- Making every document mandatory for every Program
- Redesigning staff account provisioning
- Replacing unrelated academic, attendance, results, finance, or transcript workflows
