package pk.vexel.medsims

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dagger.hilt.android.AndroidEntryPoint
import pk.vexel.medsims.core.ui.MedSimsTheme
import pk.vexel.medsims.feature.shell.MedSimsApp

@AndroidEntryPoint class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); enableEdgeToEdge(); setContent { MedSimsTheme(dark = false) { MedSimsApp() } } }
}
