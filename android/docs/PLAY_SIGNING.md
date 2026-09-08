# Play upload signing

Vexel MedSIMS uses Google Play App Signing. The local key is the **upload key**, not the Google-held app-signing key. Its private JKS is outside Git at `$HOME/.config/vexel/medsims-signing/medsims-upload.jks`; do not generate another ordinary release key.

Local Gradle properties are `MEDSIMS_UPLOAD_STORE_FILE`, `MEDSIMS_UPLOAD_STORE_PASSWORD`, `MEDSIMS_UPLOAD_KEY_ALIAS`, and `MEDSIMS_UPLOAD_KEY_PASSWORD`. `bundleRelease` fails clearly without them; debug builds do not require them. Never commit passwords, JKS files, or local properties.

Alias: `medsims-upload`; RSA 4096; SHA-1 `D7:D6:F8:31:56:1A:25:7D:E1:BC:D6:12:9B:EB:44:15:C3:14:2E:BE`; SHA-256 `EE:0D:74:92:5B:E6:EF:25:F8:C0:EA:33:65:2C:02:6B:CB:F3:45:5A:95:40:E3:B9:AB:49:EA:8B:99:66:43:9B`; validity 2026-09-09 to 2054-01-25.

Build with `./gradlew bundleRelease`; verify with `jarsigner -verify -certs app/build/outputs/bundle/release/app-release.aab`. Upload the resulting signed bundle to Play, enroll in Play App Signing, and retain the upload key securely. **EXTERNAL UPLOAD-KEY BACKUP: REQUIRED.** See the canonical Android context for machine guidance.
