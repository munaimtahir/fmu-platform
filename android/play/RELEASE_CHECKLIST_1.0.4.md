# Release checklist — 1.0.4 (Student internal testing)

- [x] Version `1.0.4` / code `4` confirmed
- [x] `python3 android/scripts/check_parity_register.py` passed
- [x] Debug/release build, lint, and unit tests passed
- [x] Instrumented tests passed — 16 tests on local API 36 emulator
- [x] Student document upload/download, learning-file handoff, and statement PDF implemented
- [x] Student Services API/UI and Profile ViewModel tests added
- [x] Rebuilt and jarsigner-verified the signed AAB after Student gap closure
- [ ] Seeded Student acceptance script passed — requires operator run against approved test data
- [x] Signed `bundleRelease` generated and verified with `jarsigner -verify -certs`
- [x] AAB SHA-256 and size recorded in `PLAY_RELEASE_HISTORY.md`
- [x] AAB-derived install/cold-launch smoke rerun after Student gap closure
- [x] Upload-key external backup confirmed by key custodian
- [x] Play Console internal-track upload performed by release operator (user-confirmed)

Do not commit credentials, keystores, or student records. The Play Console steps require the
release operator's authenticated session and are deliberately not automated here.
