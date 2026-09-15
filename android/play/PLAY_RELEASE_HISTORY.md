# Play release history

## 0.1.0 (versionCode 1) — initial internal testing submission

```text
Product:               Vexel MedSIMS
Package:               pk.vexel.medsims
Version:               0.1.0
Version code:          1

Release type:          Google Play internal testing submission
Git branch:            release/android-play-internal-v0.1.0
Git tag:               android-v0.1.0-play-submitted
Submitted Git SHA:     a049a4f2adc958744623c2e36b3a8912faa17522

AAB SHA-256:           2ac60280c386a6ebecd525fe1298b1d0ac89ea8937dd95880a50a6357533936f
AAB size:              8,742,732 bytes

Submission date:       2026-09-09
Status:                Submitted to Google Play for review (Internal Testing)
```

Upload-certificate fingerprints (public; see `android/play/upload_certificate.pem` and `android/docs/PLAY_SIGNING.md`):

```text
Alias:      medsims-upload
Key type:   RSA 4096
SHA-1:      D7:D6:F8:31:56:1A:25:7D:E1:BC:D6:12:9B:EB:44:15:C3:14:2E:BE
SHA-256:    EE:0D:74:92:5B:E6:EF:25:F8:C0:EA:33:65:2C:02:6B:CB:F3:45:5A:95:40:E3:B9:AB:49:EA:8B:99:66:43:9B
Validity:   2026-09-09 to 2054-01-25
```

Note: the AAB currently present in `android/app/build/outputs/bundle/release/app-release.aab` was regenerated after this submission during later local validation and its checksum will differ from the value recorded above — this is expected for a non-reproducible Gradle build. The submitted artifact's exact bytes are preserved at `android/play/distribution/Vexel-MedSIMS-0.1.0-play-internal.zip`, which matches the recorded SHA-256 exactly.

### Post-approval TODO

Once Google Play approves/publishes this release, update this entry with:

```text
[ ] Approval date
[ ] Testing/published status
[ ] Play-delivered version confirmation
[ ] Play App Signing certificate SHA-1
[ ] Play App Signing certificate SHA-256
```

And separately verify, once installed from Play:

```text
[ ] Package/version match
[ ] Play-delivered signing certificate recorded
[ ] Cold launch
[ ] Login
[ ] Session restoration
[ ] Logout
```

If Google rejects this submission: do not modify the `android-v0.1.0-play-submitted` tag or this entry's historical values. Instead record the rejection here, fix the issue on a new branch, reuse the same canonical `medsims-upload` signing key, increment `versionCode` (>= 2), and submit a new AAB as a new entry below.

## 1.0.2 (versionCode 2) — release candidate, superseded, not uploaded

Version `1.0.2` / `versionCode 2` was the next candidate after the historical
0.1.0 / 1 internal-testing submission. Its release notes and gates were in
`RELEASE_NOTES_1.0.2.md`. No Play upload, review, or publication was ever
recorded for this entry. Superseded by `1.0.3` below.

### CI coverage (informational, not a substitute for the manual release steps)

`.github/workflows/android-ci.yml` (`workflow_dispatch`-only) now verifies
build health and runs instrumented tests on every manual trigger: unit
tests, lint, `assembleDebug`/`assembleRelease`, a check that the
`bundleRelease` task is correctly wired (it cannot actually run unsigned —
the canonical Play upload-key signing properties are intentionally kept
outside Git per `android/docs/PLAY_SIGNING.md`), and `connectedDebugAndroidTest`
across an emulator matrix (API 28, API 34, and a `pixel_tablet` profile on
API 33). CI does not build the real signed release bundle and does not
upload to Play Console — generating the signed AAB and performing the Play
Console upload / internal-track promotion remain manual, credentialed steps
the user performs on a release machine, as described in
`android/play/RELEASE_CHECKLIST.md`.

## 1.0.3 (versionCode 3) — release candidate, not uploaded

Version `1.0.3` / `versionCode 3` supersedes the never-uploaded `1.0.2`
candidate, incorporating real code changes: the instrumented UI test suite
was verified actually running and passing for the first time (not just
building), a real duplicate-fetch bug in the Attendance/Results history
pagination was found and fixed, and the two previously-deferred Android
stretch items (offline/timeout/server error-state hardening, minimal tablet
adaptive layout) were completed. Its release notes and gates are in
`RELEASE_NOTES_1.0.3.md`; its build+verify (no-upload) checklist is in
`RELEASE_CHECKLIST_1.0.3.md`. **No Play upload, review, or publication is
recorded by this entry.**

```text
Product:               Vexel MedSIMS
Package:               pk.vexel.medsims
Version:               1.0.3
Version code:          3

Release type:          Build + verify only — NOT submitted to Google Play
Built Git SHA:          1f31d4d (chore(android): bump to 1.0.3, build+verify signed release candidate)

AAB SHA-256:            ff9b90ae705aafea13f71b5f458e57fe3643afaa509863944c63a7b684948fa1
AAB size:               4,092,615 bytes

Build date:             2026-09-12
Status:                 Signed bundle built and jarsigner-verified locally; no Play submission
```

### CI coverage (informational, not a substitute for the manual release steps)

Same `android-ci.yml` coverage as above. This cycle additionally confirmed
the `instrumented-tests` job's underlying mechanics work correctly by first
running the exact same suite locally against the `sims` AVD (API 36) and
fixing two real bugs the first-ever run surfaced (see `RELEASE_NOTES_1.0.3.md`)
— the CI matrix job itself was not separately dispatched this cycle.

## 1.0.4 (versionCode 4) — Student internal-testing release

```text
Product:               Vexel MedSIMS
Package:               pk.vexel.medsims
Version:               1.0.4
Version code:          4

Release type:          Google Play internal testing
AAB SHA-256:           2ce0b0fee8fcecc8c29547dd31442ef44b60ed6ac70289fc5b982cdb1b8e353d
AAB size:              4,310,424 bytes
Build date:             2026-09-15
Status:                 Student gap-closure bundle; signed bundle, lint, unit tests,
                        debug/release builds, and 16 instrumented tests (API 36 emulator)
                        passed locally. AAB-derived install/cold-launch smoke passed.
```

Verification evidence: `jarsigner -verify -certs` reported `jar verified`; a bundletool-derived
universal APK installed on `emulator-5554`, reported version `1.0.4` / code `4`, and launched
`pk.vexel.medsims.MainActivity`. The seeded Student acceptance script remains pending. The Play
Console upload and external upload-key backup were subsequently confirmed by the user.

## 1.1.0 (versionCode 5) — Faculty delivery candidate

Adds the Faculty dashboard, paginated own-session selection, searchable live roster, present/absent
controls, confirmation, and online-only attendance submission. Student document upload/download and
fee-statement handling remain included. Play Console promotion is intentionally manual.

```text
Product:               Vexel MedSIMS
Package:               pk.vexel.medsims
Version:               1.1.0
Version code:          5

Release type:          Build + verify — manual Play Console upload pending
AAB SHA-256:           21c540e98ae8441e899928edbc928cfdd33d21358959cb819f1ed315817e188d
AAB size:              4,315,170 bytes
Build date:             2026-09-15
Status:                 Signed release candidate; parity, lint, unit tests,
                        debug/release builds, and 16 instrumented tests passed.
                        AAB-derived install/cold-launch smoke passed.
```

Verification evidence: `jarsigner -verify -certs` reported `jar verified`; a bundletool-derived
universal APK installed on `emulator-5554`, reported version `1.1.0` / code `5`, launched, and remained
running. Demo-account results and remaining acceptance limitations are recorded in
`RELEASE_CHECKLIST_1.1.0.md`.

## 1.2.0 (versionCode 6) — Staff parity candidate

Adds the complete Faculty workflow plus Registrar, Coordinator, ExamCell, Finance and Admin native
workflows. The existing unsubmitted 1.2.0/code 6 candidate was refreshed without a version bump, per
operator direction; no Play Console operation was performed.

```text
Product:               Vexel MedSIMS
Package:               pk.vexel.medsims
Version:               1.2.0
Version code:          6

Release type:          Build + verify — intentionally not submitted
AAB SHA-256:           311b6dbe2df91f8386a099718343a987f28066ea86e75b3a29117ac09fd96871
AAB size:              4,568,671 bytes
Build date:             2026-09-15
Status:                 Signed release candidate; parity, lint, unit tests, debug/release
                        builds, 20 instrumented tests, and 269 backend tests passed.
                        Refreshed production deployment evidence is tracked in the checklist.
```

Verification evidence: `jarsigner -verify -certs` reported `jar verified`; a bundletool-derived
universal APK installed on `emulator-5554`, reported version `1.2.0` / code `6`, launched, and
remained running. Commit `8ffaadc` was deployed to production after a verified database backup;
public health and representative Registrar, Coordinator, ExamCell, Finance, Admin, Student, and
Faculty acceptance checks passed. Detailed evidence is in `RELEASE_CHECKLIST_1.2.0.md`.
