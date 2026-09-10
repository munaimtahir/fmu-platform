package pk.vexel.medsims.feature.attendance

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import pk.vexel.medsims.core.academic.AcademicRepository
import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.AttendanceApi
import pk.vexel.medsims.core.network.MobileApi
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.ResultsApi
import pk.vexel.medsims.core.network.ScreenState
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

@OptIn(ExperimentalCoroutinesApi::class)
class AttendanceViewModelTest {
    private lateinit var server: MockWebServer
    private lateinit var repository: AcademicRepository

    @Before fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        server = MockWebServer(); server.start()
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        val retrofit = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
        val api = retrofit.create(MobileApi::class.java)
        val attendanceApi = retrofit.create(AttendanceApi::class.java)
        val resultsApi = retrofit.create(ResultsApi::class.java)
        val refresher = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Success(Unit) }
        repository = AcademicRepository(api, attendanceApi, resultsApi, refresher, SessionExpiryNotifier())
    }

    @After fun tearDown() { server.shutdown(); Dispatchers.resetMain() }

    @Test fun loads_summary_then_first_history_page() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        server.enqueue(MockResponse().setResponseCode(200).setBody(PAGE_1_JSON))
        val viewModel = AttendanceViewModel(repository)
        val state = viewModel.state.first { it !is ScreenState.Loading }
        assertTrue(state is ScreenState.Content)
        val history = viewModel.history.first { it.items.isNotEmpty() || it.error != null }
        assertEquals(1, history.items.size)
        assertFalse(history.endReached)
        assertEquals(2, history.nextPage)
    }

    @Test fun loadHistory_appends_next_page_and_reaches_end() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        server.enqueue(MockResponse().setResponseCode(200).setBody(PAGE_1_JSON))
        server.enqueue(MockResponse().setResponseCode(200).setBody(PAGE_2_JSON))
        val viewModel = AttendanceViewModel(repository)
        viewModel.history.first { it.items.isNotEmpty() }
        viewModel.loadHistory()
        val finalHistory = viewModel.history.first { it.items.size == 2 }
        assertTrue(finalHistory.endReached)
        assertEquals(null, finalHistory.nextPage)
    }

    private companion object {
        const val HOME_JSON = """{"student":{"id":1,"reg_no":"S-1001","display_name":"Jane Doe"},"academic_placement":{"programme":"MBBS","batch":"2024","group":"A","status":"active"},"attendance_summary":{"total":10,"present":8,"absent":1,"late":1,"leave":0,"percentage":80.0},"latest_results":[],"today_schedule":[]}"""
        const val PAGE_1_JSON = """{"count":2,"next":"http://x/?page=2","previous":null,"results":[{"id":1,"session":10,"student":1,"status":"PRESENT","marked_at":"2026-09-01T09:00:00Z","created_at":"2026-09-01T09:00:00Z"}]}"""
        const val PAGE_2_JSON = """{"count":2,"next":null,"previous":"http://x/?page=1","results":[{"id":2,"session":11,"student":1,"status":"ABSENT","marked_at":"2026-08-25T09:00:00Z","created_at":"2026-08-25T09:00:00Z"}]}"""
    }
}
