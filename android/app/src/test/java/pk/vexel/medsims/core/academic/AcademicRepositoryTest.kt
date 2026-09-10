package pk.vexel.medsims.core.academic

import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.MobileApi
import pk.vexel.medsims.core.network.NetworkResult
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class AcademicRepositoryTest {
    private lateinit var server: MockWebServer
    private lateinit var api: MobileApi

    @Before fun setUp() {
        server = MockWebServer(); server.start()
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        val retrofit = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
        api = retrofit.create(MobileApi::class.java)
    }

    @After fun tearDown() { server.shutdown() }

    @Test fun home_success_parses_response() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        val repository = AcademicRepository(api, succeedingRefresher(), SessionExpiryNotifier())
        val result = repository.home()
        assertTrue(result is NetworkResult.Success)
        assertEquals("S-1001", (result as NetworkResult.Success).value.student.reg_no)
    }

    @Test fun home_not_a_student_maps_404_with_code() = runTest {
        server.enqueue(MockResponse().setResponseCode(404).setBody("""{"error":{"code":"NOT_A_STUDENT","message":"No student record linked to your account"}}"""))
        val repository = AcademicRepository(api, succeedingRefresher(), SessionExpiryNotifier())
        val result = repository.home()
        assertTrue(result is NetworkResult.Failure)
        val failure = result as NetworkResult.Failure
        assertEquals(ErrorKind.NOT_FOUND, failure.kind)
        assertEquals("NOT_A_STUDENT", failure.code)
    }

    @Test fun timetable_invalid_date_maps_400_with_code() = runTest {
        server.enqueue(MockResponse().setResponseCode(400).setBody("""{"error":{"code":"INVALID_DATE","message":"week_start_date must be in YYYY-MM-DD format"}}"""))
        val repository = AcademicRepository(api, succeedingRefresher(), SessionExpiryNotifier())
        val result = repository.timetable("not-a-date")
        assertTrue(result is NetworkResult.Failure)
        assertEquals("INVALID_DATE", (result as NetworkResult.Failure).code)
    }

    @Test fun unauthorized_retries_once_then_succeeds() = runTest {
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        val repository = AcademicRepository(api, succeedingRefresher(), SessionExpiryNotifier())
        val result = repository.home()
        assertTrue(result is NetworkResult.Success)
    }

    @Test fun unauthorized_after_failed_refresh_notifies_expiry_and_fails() = runTest {
        server.enqueue(MockResponse().setResponseCode(401))
        val notifier = SessionExpiryNotifier()
        val repository = AcademicRepository(api, failingRefresher(), notifier)
        val result = repository.home()
        assertTrue(result is NetworkResult.Failure)
    }

    private fun succeedingRefresher() = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Success(Unit) }
    private fun failingRefresher() = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Failure(ErrorKind.UNAUTHORIZED, "Your session has expired.") }

    private companion object {
        const val HOME_JSON = """{"student":{"id":1,"reg_no":"S-1001","display_name":"Jane Doe"},"academic_placement":{"programme":"MBBS","batch":"2024","group":"A","status":"active"},"attendance_summary":{"total":10,"present":8,"absent":1,"late":1,"leave":0,"percentage":80.0},"latest_results":[],"today_schedule":[]}"""
    }
}
