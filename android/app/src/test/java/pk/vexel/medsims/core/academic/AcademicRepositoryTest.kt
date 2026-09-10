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
import pk.vexel.medsims.core.network.AttendanceApi
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.MobileApi
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.ResultsApi
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class AcademicRepositoryTest {
    private lateinit var server: MockWebServer
    private lateinit var api: MobileApi
    private lateinit var attendanceApi: AttendanceApi
    private lateinit var resultsApi: ResultsApi

    @Before fun setUp() {
        server = MockWebServer(); server.start()
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        val retrofit = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
        api = retrofit.create(MobileApi::class.java)
        attendanceApi = retrofit.create(AttendanceApi::class.java)
        resultsApi = retrofit.create(ResultsApi::class.java)
    }

    @After fun tearDown() { server.shutdown() }

    @Test fun home_success_parses_response() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        val repository = repository()
        val result = repository.home()
        assertTrue(result is NetworkResult.Success)
        assertEquals("S-1001", (result as NetworkResult.Success).value.student.reg_no)
    }

    @Test fun home_not_a_student_maps_404_with_code() = runTest {
        server.enqueue(MockResponse().setResponseCode(404).setBody("""{"error":{"code":"NOT_A_STUDENT","message":"No student record linked to your account"}}"""))
        val repository = repository()
        val result = repository.home()
        assertTrue(result is NetworkResult.Failure)
        val failure = result as NetworkResult.Failure
        assertEquals(ErrorKind.NOT_FOUND, failure.kind)
        assertEquals("NOT_A_STUDENT", failure.code)
    }

    @Test fun timetable_invalid_date_maps_400_with_code() = runTest {
        server.enqueue(MockResponse().setResponseCode(400).setBody("""{"error":{"code":"INVALID_DATE","message":"week_start_date must be in YYYY-MM-DD format"}}"""))
        val repository = repository()
        val result = repository.timetable("not-a-date")
        assertTrue(result is NetworkResult.Failure)
        assertEquals("INVALID_DATE", (result as NetworkResult.Failure).code)
    }

    @Test fun unauthorized_retries_once_then_succeeds() = runTest {
        server.enqueue(MockResponse().setResponseCode(401))
        server.enqueue(MockResponse().setResponseCode(200).setBody(HOME_JSON))
        val repository = repository()
        val result = repository.home()
        assertTrue(result is NetworkResult.Success)
    }

    @Test fun unauthorized_after_failed_refresh_notifies_expiry_and_fails() = runTest {
        server.enqueue(MockResponse().setResponseCode(401))
        val notifier = SessionExpiryNotifier()
        val repository = repository(refresher = failingRefresher(), notifier = notifier)
        val result = repository.home()
        assertTrue(result is NetworkResult.Failure)
    }

    @Test fun attendanceHistory_parses_paginated_response() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(ATTENDANCE_PAGE_JSON))
        val repository = repository()
        val result = repository.attendanceHistory(studentId = 1, page = 1)
        assertTrue(result is NetworkResult.Success)
        val body = (result as NetworkResult.Success).value
        assertEquals(2, body.count)
        assertEquals(1, body.results.size)
        assertEquals("PRESENT", body.results[0].status)
        val request = server.takeRequest()
        assertTrue(request.path!!.contains("student=1"))
        assertTrue(request.path!!.contains("ordering=-marked_at"))
        assertTrue(request.path!!.contains("page=1"))
    }

    @Test fun resultsHistory_parses_paginated_response() = runTest {
        server.enqueue(MockResponse().setResponseCode(200).setBody(RESULTS_PAGE_JSON))
        val repository = repository()
        val result = repository.resultsHistory(studentId = 1, page = 1)
        assertTrue(result is NetworkResult.Success)
        val body = (result as NetworkResult.Success).value
        assertEquals(1, body.count)
        assertEquals("PUBLISHED", body.results[0].status)
        val request = server.takeRequest()
        assertTrue(request.path!!.contains("ordering=-created_at"))
    }

    @Test fun resultsHistory_finance_blocked_surfaces_code_reasons_and_outstanding() = runTest {
        server.enqueue(MockResponse().setResponseCode(403).setBody(FINANCE_BLOCKED_JSON))
        val repository = repository()
        val result = repository.resultsHistory(studentId = 1)
        assertTrue(result is NetworkResult.Failure)
        val failure = result as NetworkResult.Failure
        assertEquals(ErrorKind.FORBIDDEN, failure.kind)
        assertEquals("FINANCE_BLOCKED", failure.code)
        assertEquals(listOf("Results blocked: outstanding dues exceed threshold."), failure.reasons)
        assertEquals("1500.00", failure.outstanding)
    }

    private fun repository(refresher: TokenRefresher = succeedingRefresher(), notifier: SessionExpiryNotifier = SessionExpiryNotifier()) =
        AcademicRepository(api, attendanceApi, resultsApi, refresher, notifier)

    private fun succeedingRefresher() = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Success(Unit) }
    private fun failingRefresher() = object : TokenRefresher { override suspend fun refresh() = NetworkResult.Failure(ErrorKind.UNAUTHORIZED, "Your session has expired.") }

    private companion object {
        const val HOME_JSON = """{"student":{"id":1,"reg_no":"S-1001","display_name":"Jane Doe"},"academic_placement":{"programme":"MBBS","batch":"2024","group":"A","status":"active"},"attendance_summary":{"total":10,"present":8,"absent":1,"late":1,"leave":0,"percentage":80.0},"latest_results":[],"today_schedule":[]}"""
        const val ATTENDANCE_PAGE_JSON = """{"count":2,"next":"http://x/api/attendance/?page=2","previous":null,"results":[{"id":1,"session":10,"student":1,"status":"PRESENT","marked_at":"2026-09-01T09:00:00Z","created_at":"2026-09-01T09:00:00Z"}]}"""
        const val RESULTS_PAGE_JSON = """{"count":1,"next":null,"previous":null,"results":[{"id":5,"exam":2,"exam_title":"Anatomy Final","student":1,"total_obtained":"85.00","total_max":"100.00","final_outcome":"PASS","status":"PUBLISHED","created_at":"2026-08-01T09:00:00Z"}]}"""
        const val FINANCE_BLOCKED_JSON = """{"code":"FINANCE_BLOCKED","message":"Results are blocked until outstanding dues are cleared.","reasons":["Results blocked: outstanding dues exceed threshold."],"outstanding":"1500.00"}"""
    }
}
