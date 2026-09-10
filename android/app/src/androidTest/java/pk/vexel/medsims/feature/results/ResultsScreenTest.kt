package pk.vexel.medsims.feature.results

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.FakeMobileApi
import pk.vexel.medsims.core.network.FakeResultsApi
import pk.vexel.medsims.core.network.PaginatedResponse
import pk.vexel.medsims.core.network.ResultRecordDto
import pk.vexel.medsims.core.ui.MedSimsTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import retrofit2.Response
import javax.inject.Inject

/**
 * Drives [ResultsScreen] through the real Hilt DI graph, with the network layer replaced by
 * [pk.vexel.medsims.core.network.FakeNetworkModule]'s fakes so no real backend is needed.
 */
@HiltAndroidTest
class ResultsScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()

    @Inject lateinit var fakeMobileApi: FakeMobileApi
    @Inject lateinit var fakeResultsApi: FakeResultsApi

    @Before fun setUp() { hiltRule.inject() }

    @Test fun initial_load_renders_history() {
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())
        fakeResultsApi.pages = listOf(
            Response.success(
                PaginatedResponse(
                    count = 1, next = null, previous = null,
                    results = listOf(record(1, "Anatomy Final", "PASS")),
                )
            ),
        )

        composeRule.activity.setContent { MedSimsTheme(dark = false) { ResultsScreen() } }

        composeRule.onNodeWithContentDescription("Results content").assertExists()
        composeRule.onNodeWithText("Anatomy Final").assertExists()
        composeRule.onNodeWithText("Outcome: PASS").assertExists()
    }

    @Test fun finance_blocked_response_renders_blocked_card() {
        fakeMobileApi.homeResponse = Response.success(FakeMobileApi.defaultHome())
        val body = FINANCE_BLOCKED_JSON.toResponseBody("application/json".toMediaType())
        fakeResultsApi.pages = listOf(Response.error(403, body))

        composeRule.activity.setContent { MedSimsTheme(dark = false) { ResultsScreen() } }

        composeRule.waitUntil(timeoutMillis = 5_000) { fakeResultsApi.requestedPages.contains(1) }
        composeRule.onNodeWithContentDescription("Results blocked").assertExists()
        composeRule.onNodeWithText("Outstanding balance: 1500.00").assertExists()
    }

    private fun record(id: Long, examTitle: String, outcome: String) = ResultRecordDto(
        id = id, exam = 10 + id, exam_title = examTitle, student = 1,
        student_reg_no = "S-1001", student_name = "Jane Doe",
        total_obtained = "85.00", total_max = "100.00",
        final_outcome = outcome, status = "PUBLISHED", created_at = "2026-08-01T09:00:00Z",
    )

    private companion object {
        const val FINANCE_BLOCKED_JSON = """{"code":"FINANCE_BLOCKED","message":"Results are blocked until outstanding dues are cleared.","reasons":["Results blocked: outstanding dues exceed threshold."],"outstanding":"1500.00"}"""
    }
}
