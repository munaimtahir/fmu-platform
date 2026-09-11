package pk.vexel.medsims.feature.shell

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.FakeAuthApi
import pk.vexel.medsims.core.network.FakeMobileApi
import pk.vexel.medsims.core.ui.MedSimsTheme
import pk.vexel.medsims.core.ui.WindowWidthSizeClass
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import retrofit2.Response
import javax.inject.Inject

/** Drives [Shell] directly with an injected [WindowWidthSizeClass] so the rail-vs-bottom-bar branch is testable without resizing a real window. */
@HiltAndroidTest
class ShellTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()

    @Inject lateinit var fakeMobileApi: FakeMobileApi

    @Before fun setUp() {
        hiltRule.inject()
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())
    }

    @Test fun compact_width_renders_bottom_bar_not_rail() {
        composeRule.setContent {
            MedSimsTheme(dark = false) {
                Shell(user = FakeAuthApi.defaultUser(), logout = {}, widthSizeClass = WindowWidthSizeClass.COMPACT)
            }
        }
        composeRule.onNodeWithContentDescription("Navigation rail").assertDoesNotExist()
    }

    @Test fun expanded_width_renders_rail_not_bottom_bar() {
        composeRule.setContent {
            MedSimsTheme(dark = false) {
                Shell(user = FakeAuthApi.defaultUser(), logout = {}, widthSizeClass = WindowWidthSizeClass.EXPANDED)
            }
        }
        composeRule.onNodeWithContentDescription("Navigation rail").assertExists()
    }
}
