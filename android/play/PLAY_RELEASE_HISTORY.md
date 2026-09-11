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
