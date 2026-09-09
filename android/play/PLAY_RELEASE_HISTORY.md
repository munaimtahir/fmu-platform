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
