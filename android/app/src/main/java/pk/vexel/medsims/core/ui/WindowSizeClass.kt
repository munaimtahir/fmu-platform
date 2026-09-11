package pk.vexel.medsims.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration

/** Material width breakpoints (Compact/Medium/Expanded), computed from raw width so it's testable without a real window. */
enum class WindowWidthSizeClass { COMPACT, MEDIUM, EXPANDED }

fun windowWidthSizeClassOf(widthDp: Int): WindowWidthSizeClass = when {
    widthDp < 600 -> WindowWidthSizeClass.COMPACT
    widthDp < 840 -> WindowWidthSizeClass.MEDIUM
    else -> WindowWidthSizeClass.EXPANDED
}

@Composable fun currentWindowWidthSizeClass(): WindowWidthSizeClass =
    windowWidthSizeClassOf(LocalConfiguration.current.screenWidthDp)
