# Release checklist — 1.2.0 (Phases 3–5)

- [x] Version `1.2.0` / code `6` configured
- [x] Phase 3–5 workflows and artifacts registered as implemented
- [x] Capability context fetched from `/api/core/users/me/`
- [x] Backend role serialization, ExamCell RBAC, and schema types covered by tests
- [x] Parity register passes (10 workflows; 190 schema paths)
- [x] Android debug/release build, lint and unit tests passed
- [x] Android instrumented tests passed (18/18 on API 36)
- [x] Backend full test suite passed (263 tests)
- [x] Production backend backup/deployment/health verification passed
- [x] Production read-only and reversible acceptance smoke passed
- [x] Signed `bundleRelease` generated and jarsigner-verified
- [x] AAB SHA-256 and size recorded in `PLAY_RELEASE_HISTORY.md`
- [x] AAB-derived install/cold-launch smoke passed on API 36
- [ ] Play Console upload/promotion performed manually

No credentials, keystores, tokens, or production record contents belong in this file. Play Console
upload remains operator-controlled.

Production evidence (2026-09-15): a verified pre-deployment database backup was saved as
`backups/pre-deploy-android-1.2.0-20260915-041804.sql.gz`; commit `8ffaadc` was deployed; and the
public application, admin, and health routes returned HTTP 200 with database, migration, and Redis
checks healthy. Registrar, Coordinator, ExamCell, Finance, and Admin read smokes returned HTTP 200
for their representative Phase 3–5 endpoints. Student exam creation was denied with HTTP 403,
ExamCell creation reached serializer validation with HTTP 400, and a temporary Registrar department
create/update/delete cycle returned 201/200/204 before cleanup. The supplied Student and Faculty demo
accounts both passed production login, access-context, and role-home checks. Temporary acceptance
users and records were removed.
