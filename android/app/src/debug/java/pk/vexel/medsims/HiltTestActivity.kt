package pk.vexel.medsims

import android.os.Bundle
import androidx.activity.ComponentActivity
import dagger.hilt.android.AndroidEntryPoint

/**
 * Minimal Hilt-enabled host activity for instrumented Compose tests. Screens under test call
 * `setContent { ... }` on this activity so `hiltViewModel()` resolves against the real
 * (test-scoped) DI graph without going through the app's login/navigation flow.
 *
 * Lives in the `debug` source set (not `androidTest`) so it compiles into the app's own package
 * (`pk.vexel.medsims`) rather than the separate `pk.vexel.medsims.test` instrumentation package —
 * otherwise `ActivityScenario`/`Instrumentation.startActivitySync` refuses to launch it, since
 * Android will not cross-launch an activity from a different package/process even when both
 * packages share a signing certificate. Declared in `app/src/debug/AndroidManifest.xml`.
 */
@AndroidEntryPoint
class HiltTestActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
