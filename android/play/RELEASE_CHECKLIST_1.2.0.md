# Release checklist — 1.2.0 (Phases 3–5)

- [x] Version `1.2.0` / code `6` configured
- [x] Phase 3–5 workflows and artifacts registered as implemented
- [x] Capability context fetched from `/api/core/users/me/`
- [x] Backend role serialization, ExamCell RBAC, and schema types covered by tests
- [x] Parity register passes (10 workflows; 190 schema paths)
- [x] Android debug/release build, lint and unit tests passed
- [x] Android instrumented tests passed (18/18 on API 36)
- [x] Backend full test suite passed (263 tests)
- [ ] Production backend backup/deployment/health verification passed
- [ ] Production read-only and reversible acceptance smoke passed
- [x] Signed `bundleRelease` generated and jarsigner-verified
- [x] AAB SHA-256 and size recorded in `PLAY_RELEASE_HISTORY.md`
- [x] AAB-derived install/cold-launch smoke passed on API 36
- [ ] Play Console upload/promotion performed manually

No credentials, keystores, tokens, or production record contents belong in this file. Play Console
upload remains operator-controlled.
