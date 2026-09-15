# 1.0.4 local release evidence

Date: 2026-09-15

| Gate | Result |
|---|---|
| Parity register | Passed: 10 workflows, 190 schema paths |
| Unit tests | Passed: `:app:testDebugUnitTest` |
| Lint | Passed: `:app:lintDebug` |
| Build | Passed: `:app:assembleDebug :app:assembleRelease :app:bundleRelease` |
| Instrumented tests | Passed: 16 tests on local API 36 emulator |
| Bundle signature | `jarsigner -verify -certs -verbose`: `jar verified` |
| AAB | `app-release.aab`, 4,310,424 bytes, SHA-256 `2ce0b0fee8fcecc8c29547dd31442ef44b60ed6ac70289fc5b982cdb1b8e353d` |
| R8 symbols | `medsims-1.0.4-r8-mapping.zip`, SHA-256 `423675be09f78ec3e50dc3fadd16e8b7a04eb1ab795f6623b6dcdc48a57ae0e6` |
| Native-symbol upload ZIP | `native-debug-symbols-play.zip`, SHA-256 `8389167bce13372276bc5c14fb66f0c53a310b693fcfad4a168ee5d3a5c6e758` |
| Release APK smoke | Installed successfully; version `1.0.4` / code `4`; launched `MainActivity` |

The signed artifacts are generated locally and intentionally not committed. Play Console upload,
tester assignment, and the upload-key custodian's external backup remain manual controls.

Release builds request `FULL` NDK debug symbols. The native upload ZIP mirrors the ABI libraries
actually packaged in the AAB; they are stripped third-party AndroidX binaries, so it preserves
build/ABI identity but cannot add source-level symbols that the dependency publisher did not ship.
Upload the R8 mapping ZIP to any Java/Kotlin crash-reporting service that needs deobfuscation.
