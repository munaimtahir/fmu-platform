# Release checklist — 1.2.0 (full in-scope parity candidate)

- [x] Version `1.2.0` / code `6` configured
- [x] Phase 3–5 workflows and artifacts registered as implemented
- [x] Remaining Faculty gradebook and learning-material workflows implemented
- [x] Capability context fetched from `/api/core/users/me/`
- [x] Backend role serialization, ExamCell RBAC, and schema types covered by tests
- [x] Parity register passes (10 workflows; 190 schema paths)
- [x] Android debug/release build, lint and unit tests passed
- [x] Android instrumented tests passed (20/20 on API 36)
- [x] Backend full test suite passed (269 tests)
- [x] Refreshed production backend backup/deployment/health verification passed
- [x] Refreshed production Faculty acceptance smoke passed
- [x] Signed `bundleRelease` generated and jarsigner-verified
- [x] AAB SHA-256 and size recorded in `PLAY_RELEASE_HISTORY.md`
- [x] AAB-derived install/cold-launch smoke passed on API 36
- Play Console upload and version bump intentionally not performed: version 1.2.0/code 6 remains unsubmitted per operator direction.

No credentials, keystores, tokens, or production record contents belong in this file. Play Console
upload remains operator-controlled.

Production evidence (2026-09-15): a verified pre-deployment database backup was saved as
`backups/pre-deploy-android-faculty-closure-20260915-105436.sql.gz`; commit `5fb8d8b` was deployed;
and the public health route returned HTTP 200 with database, migration, and Redis checks healthy.
The supplied Faculty demo account passed login and returned HTTP 200 for identity, taught sections,
scoped students, exams, results, and learning materials. A rollback-only production contract check
returned 201 for draft result, component marks, material, and audience creation; 200 for marks update
and material publish/archive; and the required 403 for Faculty result publication. Its transaction
was rolled back and cleanup was verified, so no acceptance users or records remain.
