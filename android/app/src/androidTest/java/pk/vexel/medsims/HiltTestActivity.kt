package pk.vexel.medsims

import android.os.Bundle
import androidx.activity.ComponentActivity
import dagger.hilt.android.AndroidEntryPoint

/**
 * Minimal Hilt-enabled host activity for instrumented Compose tests. Screens under test call
 * `setContent { ... }` on this activity so `hiltViewModel()` resolves against the real
 * (test-scoped) DI graph without going through the app's login/navigation flow. Declared in
 * `app/src/androidTest/AndroidManifest.xml`.
 */
@AndroidEntryPoint
class HiltTestActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
