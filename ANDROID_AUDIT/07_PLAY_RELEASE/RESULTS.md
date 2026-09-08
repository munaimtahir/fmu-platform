# Play release

Signed AAB: `android/app/build/outputs/bundle/release/app-release.aab`; size 8,742,732 bytes; SHA-256 `2ac60280c386a6ebecd525fe1298b1d0ac89ea8937dd95880a50a6357533936f`.

`jarsigner -verify -certs` reported `jar verified`; the self-signed upload certificate warning is expected before Play App Signing. Public certificate and fingerprints are in `android/play/` and `android/docs/PLAY_SIGNING.md`. Private key and passwords remain outside Git.
