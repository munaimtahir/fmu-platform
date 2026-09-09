# Development

Read `docs/ANDROID_DEVELOPMENT_AGENT_CONTEXT.md` first. Build locally with JDK 21 and the Android 36 platform: `./gradlew :app:assembleDebug`. Use the `sims` API 36 AVD for validation, not a production VM. Do not commit `local.properties`, signing material, credentials, tokens, or build directories.
