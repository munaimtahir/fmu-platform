# Release checklist — 1.0.3 (build + verify only, no upload)

Scope for this cycle is narrower than `RELEASE_CHECKLIST.md`'s 0.1.0
submission checklist: build and verify the signed bundle locally, record its
checksum in `PLAY_RELEASE_HISTORY.md`, and complete the outstanding external
upload-key backup. **Uploading to Google Play Console is explicitly out of
scope for this cycle, by user decision** — that remains a fully separate,
later, manual action.

- [ ] Package `pk.vexel.medsims` and version 1.0.3 / 3 verified
- [ ] Signed `bundleRelease` generated and `jarsigner` verified
- [ ] Bundle checksum recorded in `PLAY_RELEASE_HISTORY.md`
- [ ] External upload-key backup performed (see `android/docs/PLAY_SIGNING.md`
      for the exact procedure) and recorded
- [ ] Optional: AAB-derived installation and cold-launch smoke test
- [ ] Play Console Internal Testing upload — **not performed this cycle**
