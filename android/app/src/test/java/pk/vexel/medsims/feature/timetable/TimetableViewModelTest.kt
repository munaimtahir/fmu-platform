package pk.vexel.medsims.feature.timetable

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
class TimetableViewModelTest {
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

    @Test fun loads_week_entries() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(WEEK_JSON))
        val viewModel = TimetableViewModel(repository)
        val state = viewModel.state.first { it !is ScreenState.Loading }
        assertTrue(state is ScreenState.Content)
        assertEquals(1, (state as ScreenState.Content).value.entries.size)
    }

    @Test fun no_entries_maps_to_empty_source() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody("""{"week_start_date":"2026-09-07","entries":[],"source":"none"}"""))
        val viewModel = TimetableViewModel(repository)
        val state = viewModel.state.first { it !is ScreenState.Loading }
        assertTrue(state is ScreenState.Content)
        val content = state as ScreenState.Content
        assertTrue(content.value.entries.isEmpty())
        assertEquals("none", content.value.source)
    }

    private companion object {
        const val WEEK_JSON = """{"week_start_date":"2026-09-07","entries":[{"id":1,"date":"2026-09-08","day_of_week":1,"day_name":"Tuesday","start_time":"09:00","end_time":"10:00","course_code":"ANAT-101","course_name":"Anatomy","faculty_name":"Dr. Khan","room":"A1","status":"SCHEDULED","source":"entry"}],"source":"entry"}"""
    }
}
