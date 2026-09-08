package pk.vexel.medsims.core.ui

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Light = lightColorScheme(primary = Color(0xFF075E54), secondary = Color(0xFF386A62), tertiary = Color(0xFF6A4E00), error = Color(0xFFBA1A1A))
private val Dark = darkColorScheme(primary = Color(0xFF6DDAC6), secondary = Color(0xFFB0CCC5), tertiary = Color(0xFFF2C667), error = Color(0xFFFFB4AB))
@Composable fun MedSimsTheme(dark: Boolean, content: @Composable () -> Unit) { MaterialTheme(colorScheme = if (dark) Dark else Light, typography = Typography(), content = content) }
