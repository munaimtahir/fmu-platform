# Testing

Run `./gradlew test lint assembleDebug assembleRelease`. Unit tests cover role/error logic and MockWebServer contract checks; instrumentation/Compose tests validate login rendering. For end-to-end validation boot `sims`, install the debug APK, and use only authorized credentials.
