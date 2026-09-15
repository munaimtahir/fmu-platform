package pk.vexel.medsims.feature.faculty

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.*
import pk.vexel.medsims.core.ui.MedSimsTheme
import retrofit2.Response
import javax.inject.Inject

@HiltAndroidTest
class FacultyScreensTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()
    @Inject lateinit var api: FakeFacultyApi
    @Before fun setUp() { hiltRule.inject() }

    @Test fun dashboard_renders_role_stats() {
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyHomeScreen() } }
        composeRule.onNodeWithText("Faculty dashboard").assertExists()
        composeRule.onNodeWithText("My sessions").assertExists()
        composeRule.onNodeWithText("40").assertExists()
    }

    @Test fun roster_can_be_marked_and_confirmed() {
        api.sessionsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultySessionDto(9, 1, "Fall", 2, "A", 7, "Dr Khan", 3, "Medicine", "2026-09-15T09:00:00Z", "2026-09-15T10:00:00Z"))))
        api.rosterResponse = Response.success(LiveRosterDto(9, 2, "2026-09-15", students = listOf(LiveRosterStudentDto(1, "S1", "Jane"), LiveRosterStudentDto(2, "S2", "Ali"))))
        api.submitResponse = Response.success(LiveAttendanceResultDto(2, absent = 1))
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyAttendanceScreen() } }
        composeRule.onNodeWithText("Jane").performClick()
        composeRule.onNodeWithText("Submit attendance").performClick()
        composeRule.onNodeWithText("Submit 2 students: 1 present and 1 absent?").assertExists()
        composeRule.onNodeWithText("Submit").performClick()
        composeRule.waitUntil(5_000) { api.lastSubmit != null }
        assert(api.lastSubmit?.records?.single()?.student_id == 1L)
    }
}
