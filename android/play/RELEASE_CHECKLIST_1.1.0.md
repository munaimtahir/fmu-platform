# Release checklist — 1.1.0 (Faculty delivery)

- [x] Version `1.1.0` / code `5` configured
- [x] Parity register passed (10 workflows; 190 schema paths)
- [x] Debug/release build, lint, and unit tests passed
- [x] Instrumented tests passed (16/16 on API 36 emulator)
- [ ] Student demo acceptance smoke passed
- [ ] Faculty demo acceptance smoke passed
- [x] Signed `bundleRelease` generated and jarsigner-verified
- [x] AAB SHA-256 and size recorded in `PLAY_RELEASE_HISTORY.md`
- [x] AAB-derived install/cold-launch smoke passed
- [ ] Play Console upload/promotion performed manually

Demo evidence (2026-09-15): both supplied accounts authenticated through the installed v1.1.0 app
against `https://sims.vexel.pk/`. The Student home, timetable, profile, and Student Services loaded;
after production backend deployment `e237fb2`, finance summary/statement/PDF return HTTP 200 and the
app renders the zero-balance fee card. The fixture still has no attendance, results, notifications,
learning materials, or compliance records, so data-complete Student acceptance remains unchecked.
The Faculty dashboard, five own sessions, and a nine-person live roster loaded successfully in the
app. A live attendance mutation was intentionally not submitted, so full Faculty acceptance remains
unchecked.

Do not commit credentials, keystores, or demo/student records. Demo credentials and Play Console
operations remain outside repository files.
