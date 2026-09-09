# Vexel MedSIMS Android — 1.0.2 release candidate

Package: `pk.vexel.medsims`
Version: `1.0.2` (`versionCode 2`)

## Candidate changes

- Preserve the existing authentication, session, profile, and service-health
  foundation while preparing it for a reproducible signed release.
- Enable release shrinking/obfuscation and retain symbol-table debug metadata.
- Add an application icon and explicit Android backup/data-extraction rules that
  exclude the encrypted session preferences.
- Keep the release workflow manually invoked; this file does **not** authorize
  a Google Play upload.

## Release gate

Before any upload, record the final Git SHA and signed AAB SHA-256 in
`PLAY_RELEASE_HISTORY.md`, verify the canonical external upload key is used,
and complete the release checklist. The `android-v0.1.0-play-submitted` tag is
historical and must not be moved.
