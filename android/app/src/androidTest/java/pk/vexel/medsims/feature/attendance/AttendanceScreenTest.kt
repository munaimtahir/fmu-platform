package pk.vexel.medsims.feature.attendance

import androidx.activity.compose.setContent
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollToIndex
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.AttendanceRecordDto
import pk.vexel.medsims.core.network.FakeAttendanceApi
import pk.vexel.medsims.core.network.FakeMobileApi
import pk.vexel.medsims.core.network.PaginatedResponse
import pk.vexel.medsims.core.ui.MedSimsTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import retrofit2.Response
import javax.inject.Inject

/**
 * Drives [AttendanceScreen] through the real Hilt DI graph (AttendanceViewModel ->
 * AcademicRepository -> AttendanceApi), with the network layer replaced by
 * [pk.vexel.medsims.core.network.FakeNetworkModule]'s fakes so no real backend is needed.
 */
@HiltAndroidTest
class AttendanceScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()

    @Inject lateinit var fakeMobileApi: FakeMobileApi
    @Inject lateinit var fakeAttendanceApi: FakeAttendanceApi

    @Before fun setUp() { hiltRule.inject() }

    @Test fun initial_load_renders_summary_and_history() {
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())
        fakeAttendanceApi.pages = listOf(
            Response.success(
                PaginatedResponse(
                    count = 2, next = null, previous = null,
                    results = listOf(record(1, "PRESENT"), record(2, "ABSENT")),
                )
            ),
        )

        composeRule.activity.setContent { MedSimsTheme(dark = false) { AttendanceScreen() } }

        composeRule.onNodeWithContentDescription("Attendance content").assertExists()
        composeRule.onNodeWithText("80.0% overall").assertExists()
        composeRule.onNodeWithText("PRESENT").assertExists()
        composeRule.onNodeWithText("ABSENT").assertExists()
    }

    @Test fun scrolling_to_the_end_loads_the_next_history_page() {
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())
        val firstPageRecords = (1..20).map { record(it.toLong(), "PRESENT") }
        fakeAttendanceApi.pages = listOf(
            Response.success(PaginatedResponse(count = 21, next = "https://x/api/attendance/?page=2", previous = null, results = firstPageRecords)),
            Response.success(PaginatedResponse(count = 21, next = null, previous = null, results = listOf(record(21, "PAGE_TWO_MARKER")))),
        )

        composeRule.activity.setContent { MedSimsTheme(dark = false) { AttendanceScreen() } }

        composeRule.waitUntil(timeoutMillis = 5_000) { fakeAttendanceApi.requestedPages.contains(1) }

        // AttendanceContent renders 3 header items (title, summary card, "History" label) before
        // the history list, so the last item of a 20-record first page sits at index 22.
        composeRule.onNode(hasScrollAction()).performScrollToIndex(3 + firstPageRecords.size - 1)

        composeRule.waitUntil(timeoutMillis = 5_000) { fakeAttendanceApi.requestedPages.contains(2) }
        composeRule.onNodeWithText("PAGE_TWO_MARKER").assertExists()
    }

    private fun record(id: Long, status: String) = AttendanceRecordDto(
        id = id, session = 100 + id, student = 1,
        student_reg_no = "S-1001", student_name = "Jane Doe", session_department = "Anatomy",
        status = status, marked_by_username = "faculty1", marked_at = "2026-09-0${(id % 9) + 1}T09:00:00Z",
        created_at = "2026-09-0${(id % 9) + 1}T09:00:00Z",
    )
}
