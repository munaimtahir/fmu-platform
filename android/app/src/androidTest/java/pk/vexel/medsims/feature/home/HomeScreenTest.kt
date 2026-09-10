package pk.vexel.medsims.feature.home

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.FakeMobileApi
import pk.vexel.medsims.core.ui.MedSimsTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import retrofit2.Response
import javax.inject.Inject

/** Drives [HomeScreen] through the real Hilt DI graph with [FakeMobileApi] standing in for the backend. */
@HiltAndroidTest
class HomeScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()

    @Inject lateinit var fakeMobileApi: FakeMobileApi

    @Before fun setUp() { hiltRule.inject() }

    @Test fun renders_student_summary() {
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())

        composeRule.activity.setContent {
            MedSimsTheme(dark = false) {
                HomeScreen(onOpenTimetable = {}, onOpenAttendance = {}, onOpenResults = {})
            }
        }

        composeRule.onNodeWithContentDescription("Home content").assertExists()
        composeRule.onNodeWithText("Welcome, Jane Doe").assertExists()
        composeRule.onNodeWithText("S-1001").assertExists()
    }
}
