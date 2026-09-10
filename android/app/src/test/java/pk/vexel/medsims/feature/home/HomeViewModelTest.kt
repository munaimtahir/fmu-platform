package pk.vexel.medsims.feature.home

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
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.MobileApi
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.ScreenState
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    private lateinit var server: MockWebServer
    private lateinit var repository: AcademicRepository

    @Before fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        server = MockWebServer(); server.start()
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        val retrofit = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
        val api = retrofit.create(MobileApi::class.java)
        val refresher = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Success(Unit) }
        repository = AcademicRepository(api, refresher, SessionExpiryNotifier())
    }

    @After fun tearDown() { server.shutdown(); Dispatchers.resetMain() }

    @Test fun loads_home_and_exposes_content() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        val viewModel = HomeViewModel(repository)
        val state = viewModel.state.first { it !is ScreenState.Loading }
        assertTrue(state is ScreenState.Content)
        assertEquals("Jane Doe", (state as ScreenState.Content).value.student.display_name)
    }

    @Test fun not_a_student_exposes_error_with_code() = runTest {
        server.enqueue(MockResponse().setResponseCode(404).setBody("""{"error":{"code":"NOT_A_STUDENT","message":"No student record linked to your account"}}"""))
        val viewModel = HomeViewModel(repository)
        val state = viewModel.state.first { it !is ScreenState.Loading }
        assertTrue(state is ScreenState.Error)
        val error = state as ScreenState.Error
        assertEquals(ErrorKind.NOT_FOUND, error.kind)
        assertEquals("NOT_A_STUDENT", error.code)
    }

    private companion object {
        const val HOME_JSON = """{"student":{"id":1,"reg_no":"S-1001","display_name":"Jane Doe"},"academic_placement":{"programme":"MBBS","batch":"2024","group":"A","status":"active"},"attendance_summary":{"total":10,"present":8,"absent":1,"late":1,"leave":0,"percentage":80.0},"latest_results":[],"today_schedule":[]}"""
    }
}
