package pk.vexel.medsims.core.network

import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Hand-rolled fakes for every Retrofit API interface [NetworkModule] provides. Bound in place of
 * the real module by [FakeNetworkModule] so instrumented tests exercise the real Hilt DI graph
 * (repositories, view models, screens) without touching the network. Each fake exposes mutable
 * public state so a test can script exactly the responses it needs before rendering a screen.
 */
@Singleton
class FakeAuthApi @Inject constructor() : AuthApi {
    var loginResponse: Response<LoginResponse> = Response.success(defaultLoginResponse())
    var refreshResponse: Response<RefreshResponse> = Response.success(RefreshResponse("fake-access", "fake-refresh"))
    var logoutResponse: Response<Unit> = Response.success(Unit)
    var meResponse: Response<UserDto> = Response.success(defaultUser())

    override suspend fun login(request: LoginRequest): Response<LoginResponse> = loginResponse
    override suspend fun refresh(request: RefreshRequest): Response<RefreshResponse> = refreshResponse
    override suspend fun logout(request: LogoutRequest): Response<Unit> = logoutResponse
    override suspend fun me(): Response<UserDto> = meResponse

    companion object {
        fun defaultUser() = UserDto(id = 1, username = "jane", email = "jane@example.edu", full_name = "Jane Doe", role = "Student", student_id = 1)
        fun defaultLoginResponse() = LoginResponse(user = defaultUser(), tokens = TokenPair(access = "fake-access", refresh = "fake-refresh"))
    }
}

@Singleton
class FakeHealthApi @Inject constructor() : HealthApi {
    var response: Response<HealthResponse> = Response.success(HealthResponse("ok"))
    override suspend fun health(): Response<HealthResponse> = response
}

@Singleton
class FakeMobileApi @Inject constructor() : MobileApi {
    var homeResponse: Response<StudentHomeResponse> = Response.success(defaultHome())
    var timetableResponse: Response<StudentTimetableResponse> = Response.success(StudentTimetableResponse("2026-09-07", emptyList(), "live"))
    val homeRequestCount get() = _homeRequestCount
    private var _homeRequestCount = 0

    override suspend fun studentHome(): Response<StudentHomeResponse> { _homeRequestCount++; return homeResponse }
    override suspend fun studentTimetable(weekStartDate: String?): Response<StudentTimetableResponse> = timetableResponse

    companion object {
        fun defaultHome(studentId: Long = 1) = StudentHomeResponse(
            student = StudentIdentityDto(id = studentId, reg_no = "S-1001", display_name = "Jane Doe"),
            academic_placement = AcademicPlacementDto(programme = "MBBS", batch = "2024", group = "A", status = "active"),
            attendance_summary = AttendanceSummaryDto(total = 10, present = 8, absent = 1, late = 1, leave = 0, percentage = 80.0),
            latest_results = emptyList(),
            today_schedule = emptyList(),
        )
    }
}

/** Serves [pages] one page at a time (1-indexed) and records every requested page number. */
@Singleton
class FakeAttendanceApi @Inject constructor() : AttendanceApi {
    var pages: List<Response<PaginatedResponse<AttendanceRecordDto>>> = emptyList()
    val requestedPages = mutableListOf<Int?>()

    override suspend fun list(studentId: Long, ordering: String, page: Int?): Response<PaginatedResponse<AttendanceRecordDto>> {
        requestedPages += page
        val index = (page ?: 1) - 1
        return pages.getOrElse(index) { Response.success(PaginatedResponse(count = 0, next = null, previous = null, results = emptyList())) }
    }
}

/** Serves [pages] one page at a time (1-indexed) and records every requested page number. */
@Singleton
class FakeResultsApi @Inject constructor() : ResultsApi {
    var pages: List<Response<PaginatedResponse<ResultRecordDto>>> = emptyList()
    val requestedPages = mutableListOf<Int?>()

    override suspend fun list(studentId: Long, ordering: String, page: Int?): Response<PaginatedResponse<ResultRecordDto>> {
        requestedPages += page
        val index = (page ?: 1) - 1
        return pages.getOrElse(index) { Response.success(PaginatedResponse(count = 0, next = null, previous = null, results = emptyList())) }
    }
}
