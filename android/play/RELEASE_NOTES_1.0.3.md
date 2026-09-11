# Vexel MedSIMS Android — 1.0.3 release candidate

Package: `pk.vexel.medsims`
Version: `1.0.3` (`versionCode 3`)

## Candidate changes

- Verified the `@HiltAndroidTest` instrumented UI suite (Login/Home/Attendance/
  Results/Shell) actually runs and passes on a real device/emulator for the
  first time — previously it only built/packaged. Fixed two genuine bugs the
  first real run surfaced: `HiltTestActivity` was hosted in the wrong
  process (moved to the `debug` source set) and every test called
  `Activity.setContent` off the main thread instead of the Compose test
  rule's own `setContent`.
- Found and fixed a real infinite-scroll bug: the "load next page" trigger
  in the Attendance/Results history lists counted the whole screen's items
  (including headers) instead of the actual paginated list, so it could
  misfire on short or empty lists — including right after a failed fetch,
  causing a duplicate request. Scoped the trigger to require existing
  history items.
- Offline/timeout/server error-state hardening: distinct copy and
  `contentDescription` per `ErrorKind` (offline / timeout / server) instead
  of one generic error message for every failure mode; `SocketTimeoutException`
  is now distinguished from generic connectivity loss.
- Minimal tablet adaptive layout: the app shell switches from a bottom
  `NavigationBar` to a side `NavigationRail` at Medium/Expanded window
  widths, and screen content is width-capped/centered so it no longer
  stretches edge-to-edge on a tablet.
- Keep the release workflow manually invoked; this file does **not**
  authorize a Google Play upload.

## Release gate

Before any upload, record the final Git SHA and signed AAB SHA-256 in
`PLAY_RELEASE_HISTORY.md`, verify the canonical external upload key is used,
and complete `RELEASE_CHECKLIST_1.0.3.md`. The `android-v0.1.0-play-submitted`
tag is historical and must not be moved. This build supersedes the earlier
`1.0.2` candidate, which was never uploaded to Play.
