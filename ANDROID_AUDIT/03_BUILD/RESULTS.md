# Build Results

Normal online dependency resolution completed. A clean debug build passed. Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

`testDebugUnitTest`: PASS (2 unit tests).

Release compilation initially exposed a real configuration defect: `HttpLoggingInterceptor` was debug-only although referenced from shared source. It was moved to the compile classpath while construction remains `BuildConfig.DEBUG` guarded. An unsigned release APK was produced at `android/app/build/outputs/apk/release/app-release-unsigned.apk`. No lint suppression was added.
