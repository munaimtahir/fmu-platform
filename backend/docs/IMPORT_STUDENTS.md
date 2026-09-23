# Student provisioning and onboarding

Student import is create-only. It provisions the linked User, Person and Student,
STUDENT membership, placement and applicable document requirements atomically per
row. There is no UPSERT, generated-password mode or academic auto-creation.

## Staff workflow

1. Create active Programs and Batches in Academics; Groups are optional.
2. Create active onboarding document definitions in Compliance and assign global,
   Program or Batch scopes in **Onboarding rules**. Applicable scopes are additive.
3. Open Student Import (`/system/students/import`), download the current template,
   fill it locally and preview the CSV.
4. Check row errors and commit. The browser resends the original file; its hash
   must match the preview. Valid rows succeed independently of invalid rows.
5. Review history/details and download the password-free error report if needed.
6. Communicate registration numbers and temporary passwords through the approved
   offline channel. The application never returns passwords.

Required columns: `first_name,last_name,registration_number,program_id,batch_id,initial_password`.

Optional columns: `middle_name,group_id,email,mobile_number,date_of_birth,gender`.
Use the downloaded template's column order. Dates use `YYYY-MM-DD`. IDs must
identify existing, compatible academic records. Registration numbers are normalized
to uppercase and serve as usernames. Passwords must pass Django validators.

Rows are CREATE, UNCHANGED (matching linked identity and placement), or REJECT.
Re-import never overwrites existing records. Retrying a committed job returns its
saved result. Only its creator may commit it.

## Follow-through

First login requires replacing the temporary password before accessing student
APIs. Profile Onboarding then supports section-by-section saves, required document
uploads/replacements and reviewer feedback. Incomplete profiles show a dashboard
reminder but do not lock the application. Submitted or verified required documents
satisfy onboarding; rejected ones do not.

Staff use onboarding filters and student detail summaries, with dedicated profile
correction, placement and status controls. Admin password reset requires a supplied
and confirmed temporary password, invalidates old tokens and preserves progress.
Compliance provides verification, rejection and protected downloads. Archiving
rules removes applicability without deleting submission history.

## API

All import routes are under `/api/admin/students/import/`:

| Method and suffix | Input / result |
| --- | --- |
| GET `template/` | Current CSV template |
| POST `preview/` | Multipart `file`; sanitized preview and job ID |
| POST `commit/` | Multipart `file`, `import_job_id`, `confirm=true`; created/unchanged/failed counts |
| GET `jobs/` | Import history |
| GET `{id}/detail/` | Job details |
| GET `{id}/errors.csv/` | Protected, password-free error CSV |

Tasks: `students.imports.view` for history/template/downloads and
`students.imports.execute` for preview/commit. Default Admin, Registrar and
Coordinator grants include import access. Monitoring requires
`students.onboarding.view`; corrections and placement have separate tasks.

## Storage and retention

Source CSVs are never retained. Preview metadata and error reports omit passwords.
Previews expire after 24 hours; error files expire after 30 days. Job metadata is
retained. Default and production Compose stacks run an hourly `import-retention`
service. On non-Compose installations schedule daily or hourly:

```sh
python manage.py purge_student_import_artifacts
```

Documents and error files use `PRIVATE_MEDIA_ROOT` (default `backend/private_media`),
separate from public media. Never expose this directory through the web server.
Back it up with the database and preserve its service-account permissions and
Compose mount. Downloads require owner or authorized staff access. Uploads accept
PDF/JPEG/PNG up to 10 MB with extension, MIME and signature validation.

## Verification and deployment

Run backend pytest suites and frontend type-check, lint, tests and build. From
`frontend`, run the isolated real-backend browser workflow:

```sh
npm run e2e:onboarding
```

The browser harness migrates a temporary database without resetting developer or
deployment data. Deployment requires migrations, RBAC task seeding, private-storage
permissions and a deployed smoke test. No backward-compatibility migration or
production-data backfill is required for this pre-production application.

The **Student Onboarding Acceptance** GitHub workflow runs backend onboarding
tests and the isolated browser scenario when manually triggered. It retains
screenshots and failure traces as artifacts. See the implementation plan's
deployment checklist before treating local acceptance as deployed acceptance.
