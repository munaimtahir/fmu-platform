# Release checklist

CI note (`.github/workflows/android-ci.yml`, `workflow_dispatch`-only): the
`build` job runs `assembleDebug`, unit tests, lint, and `assembleRelease`, and
verifies the `bundleRelease` task graph is wired correctly (it cannot produce
a real signed AAB in CI — the canonical MedSIMS upload-key signing
properties live only on release machines outside Git, per
`android/docs/PLAY_SIGNING.md`, and must never be added to CI). A separate
`instrumented-tests` job runs `connectedDebugAndroidTest` across an emulator
matrix (older + current API levels, plus a tablet-class profile). None of
this uploads to Play Console — the steps below that involve the signed AAB
and the Play Console upload/track promotion remain a manual, credentialed
step the user performs locally.

- [x] Package `pk.vexel.medsims` and version 0.1.0 / 1 verified
- [x] HTTPS production API and cleartext rejection configured
- [x] Upload key created outside Git; public certificate committed
- [x] Signed `bundleRelease` generated and `jarsigner` verified
- [x] Bundle checksum recorded
- [x] bundletool 1.18.3 validation
- [x] AAB-derived installation and cold-launch smoke test on `sims`
- [ ] External upload-key backup
- [x] Play Console Internal Testing upload
