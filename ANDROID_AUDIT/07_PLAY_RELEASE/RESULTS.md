# Play release

Canonical signing source: `$HOME/.config/vexel/medsims-signing/signing.properties`; canonical key: `$HOME/.config/vexel/medsims-signing/medsims-upload.jks`; alias `medsims-upload`. Gradle reads this local-only file directly.

Signed AAB: `android/app/build/outputs/bundle/release/app-release.aab`; size 8,742,732 bytes; SHA-256 `2ac60280c386a6ebecd525fe1298b1d0ac89ea8937dd95880a50a6357533936f`.

`jarsigner -verify -certs` reported `jar verified`; the self-signed upload certificate warning is expected before Play App Signing. Public certificate and fingerprints are in `android/play/` and `android/docs/PLAY_SIGNING.md`. Private key and passwords remain outside Git.

Bundletool 1.18.3 was obtained from the official `google/bundletool` GitHub release and validated this exact AAB successfully. A universal APK set was generated from the exact AAB, signed with the canonical upload key, installed on `sims` (`emulator-5556`), and cold-launched. Installed package metadata: `pk.vexel.medsims`, versionName `0.1.0`, versionCode `1`, minSdk `26`, targetSdk `36`. The release login screen rendered without release-only crashes or TLS/network-policy errors. The release manifest requests no dangerous runtime permissions; source/release configuration uses `https://sims.vexel.pk/`, `usesCleartextTraffic=false`, and backup disabled.
