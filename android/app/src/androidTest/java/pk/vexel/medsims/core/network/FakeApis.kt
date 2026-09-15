package pk.vexel.medsims.core.network

import retrofit2.Response
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.*
import okhttp3.MultipartBody
import okhttp3.RequestBody

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
    var updateProfileResponse: Response<UserDto> = Response.success(defaultUser())
    var changePasswordResponse: Response<MessageResponse> = Response.success(MessageResponse("Password updated."))

    override suspend fun login(request: LoginRequest): Response<LoginResponse> = loginResponse
    override suspend fun refresh(request: RefreshRequest): Response<RefreshResponse> = refreshResponse
    override suspend fun logout(request: LogoutRequest): Response<Unit> = logoutResponse
    override suspend fun me(): Response<UserDto> = meResponse
    override suspend fun updateProfile(request: ProfileUpdateRequest): Response<UserDto> = updateProfileResponse
    override suspend fun changePassword(request: PasswordChangeRequest): Response<MessageResponse> = changePasswordResponse

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

@Singleton class FakeCoreApi @Inject constructor():CoreApi{
    var response:Response<AccessContextDto> = Response.success(AccessContextDto(1,"jane",roles=listOf(AccessRoleDto(1,"STUDENT"))))
    override suspend fun accessContext()=response
}

@Singleton class FakeStaffApi @Inject constructor():StaffApi{
    var jsonResponse:Response<JsonElement> = Response.success(JsonArray(emptyList()))
    override suspend fun get(url:String)=jsonResponse
    override suspend fun post(url:String,body:JsonElement)=jsonResponse
    override suspend fun patch(url:String,body:JsonElement)=jsonResponse
    override suspend fun delete(url:String)=Response.success(Unit)
    override suspend fun download(url:String)=Response.success(ByteArray(0).toResponseBody("application/octet-stream".toMediaType()))
    override suspend fun upload(url:String,file:MultipartBody.Part,mode:RequestBody,autoCreate:RequestBody)=jsonResponse
}

@Singleton
class FakeMobileApi @Inject constructor() : MobileApi {
    var homeResponse: Response<StudentHomeResponse> = Response.success(defaultHome())
    var timetableResponse: Response<StudentTimetableResponse> = Response.success(StudentTimetableResponse("2026-09-07", emptyList(), "live"))
    /** When set, [studentHome] throws this instead of returning [homeResponse] — used to script OFFLINE/TIMEOUT. */
    var homeThrowable: Throwable? = null
    val homeRequestCount get() = _homeRequestCount
    private var _homeRequestCount = 0

    override suspend fun studentHome(): Response<StudentHomeResponse> {
        _homeRequestCount++
        homeThrowable?.let { throw it }
        return homeResponse
    }
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

@Singleton
class FakeStudentApi @Inject constructor() : StudentApi {
    var notificationsResponse = Response.success(PaginatedResponse<NotificationInboxDto>(0, null, null, emptyList()))
    var unreadResponse = Response.success(UnreadCountDto(0))
    var materialsResponse = Response.success(emptyList<LearningMaterialDto>())
    var complianceResponse = Response.success(PaginatedResponse<RequirementDto>(0, null, null, emptyList()))
    var financeResponse = Response.success(StudentFinanceSummaryDto(1, "0", "0", "0"))
    var submitCount = 0
    override suspend fun notifications(page: Int?) = notificationsResponse
    override suspend fun markNotificationRead(id: Long) = Response.success<NotificationInboxDto>(null)
    override suspend fun markAllNotificationsRead() = Response.success(MarkedReadDto(0))
    override suspend fun unreadCount() = unreadResponse
    override suspend fun learningFeed() = materialsResponse
    override suspend fun compliance(page: Int?) = complianceResponse
    override suspend fun submitCompliance(id: Long, file: okhttp3.MultipartBody.Part?, value: okhttp3.RequestBody?): Response<RequirementDto> { submitCount++; return complianceResponse.body()?.results?.firstOrNull()?.let { Response.success(it) } ?: Response.success(null) }
    override suspend fun finance(id: Long) = financeResponse
    override suspend fun statementPdf(id: Long) = Response.success("pdf".toResponseBody("application/pdf".toMediaType()))
    override suspend fun download(url: String) = Response.success("document".toResponseBody("application/octet-stream".toMediaType()))
}

@Singleton
class FakeFacultyApi @Inject constructor() : FacultyApi {
    var dashboardResponse = Response.success(FacultyDashboardDto(3, 40, 2))
    var sessionsResponse = Response.success(PaginatedResponse<FacultySessionDto>(0, null, null, emptyList()))
    var rosterResponse = Response.success(LiveRosterDto(1, 1, "2026-09-15", students = emptyList()))
    var submitResponse = Response.success(LiveAttendanceResultDto(total = 0))
    var lastSubmit: LiveAttendanceRequest? = null
    var studentsResponse = Response.success(PaginatedResponse<FacultyStudentDto>(0, results = emptyList()))
    var examsResponse = Response.success(PaginatedResponse<FacultyExamDto>(0, results = emptyList()))
    var gradebookResponse = Response.success(PaginatedResponse<FacultyResultDto>(0, results = emptyList()))
    var sectionsResponse = Response.success(PaginatedResponse<FacultySectionDto>(0, results = emptyList()))
    var facultyMaterialsResponse = Response.success(PaginatedResponse<LearningMaterialDto>(0, results = emptyList()))
    var lastCreatedResult: FacultyResultWriteRequest? = null
    var lastCreatedLink: FacultyMaterialLinkRequest? = null
    var lastAudience: FacultyAudienceRequest? = null
    var lastPublishedMaterialId: Long? = null
    override suspend fun dashboard() = dashboardResponse
    override suspend fun sessions(ordering: String, page: Int?) = sessionsResponse
    override suspend fun roster(sessionId: Long) = rosterResponse
    override suspend fun submitAttendance(request: LiveAttendanceRequest): Response<LiveAttendanceResultDto> { lastSubmit = request; return submitResponse }
    override suspend fun students(search: String?, page: Int?) = studentsResponse
    override suspend fun exams(page: Int?) = examsResponse
    override suspend fun gradebook(search: String?, page: Int?) = gradebookResponse
    override suspend fun createResult(request: FacultyResultWriteRequest): Response<FacultyResultDto> {
        lastCreatedResult = request
        return Response.success(FacultyResultDto(10, request.exam, student = request.student, total_obtained = request.total_obtained, total_max = request.total_max))
    }
    override suspend fun updateResult(id: Long, request: FacultyResultUpdateRequest) = Response.success(FacultyResultDto(id, 1, student = 1, total_obtained = request.total_obtained, total_max = request.total_max))
    override suspend fun createResultComponent(request: FacultyComponentWriteRequest) = Response.success(FacultyResultComponentDto(20, request.result_header ?: 0, request.exam_component ?: 0, marks_obtained = request.marks_obtained))
    override suspend fun updateResultComponent(id: Long, request: FacultyComponentWriteRequest) = Response.success(FacultyResultComponentDto(id, 1, 1, marks_obtained = request.marks_obtained))
    override suspend fun deleteResultComponent(id: Long) = Response.success(Unit)
    override suspend fun sections(page: Int?) = sectionsResponse
    override suspend fun materials(search: String?, page: Int?) = facultyMaterialsResponse
    override suspend fun createLinkMaterial(request: FacultyMaterialLinkRequest): Response<LearningMaterialDto> {
        lastCreatedLink = request
        return Response.success(LearningMaterialDto(30, request.title, request.description, request.kind, url = request.url, status = "DRAFT", created_by = 1))
    }
    override suspend fun createFileMaterial(file: MultipartBody.Part, title: RequestBody, description: RequestBody, kind: RequestBody, availableFrom: RequestBody?, availableUntil: RequestBody?) = Response.success(LearningMaterialDto(31, "Uploaded file", kind = "FILE", status = "DRAFT", created_by = 1))
    override suspend fun updateMaterial(id: Long, request: FacultyMaterialUpdateRequest) = Response.success(LearningMaterialDto(id, request.title, request.description, "LINK", url = request.url, status = "DRAFT", created_by = 1))
    override suspend fun deleteMaterial(id: Long) = Response.success(Unit)
    override suspend fun publishMaterial(id: Long, request: EmptyRequest): Response<LearningMaterialDto> {
        lastPublishedMaterialId = id
        return Response.success(LearningMaterialDto(id, "Published", kind = "LINK", status = "PUBLISHED", created_by = 1))
    }
    override suspend fun archiveMaterial(id: Long, request: EmptyRequest) = Response.success(LearningMaterialDto(id, "Archived", kind = "LINK", status = "ARCHIVED", created_by = 1))
    override suspend fun addMaterialAudience(id: Long, request: FacultyAudienceRequest): Response<List<LearningMaterialAudienceDto>> {
        lastAudience = request
        return Response.success(listOf(LearningMaterialAudienceDto(40, id, section = request.section)))
    }
    override suspend fun deleteMaterialAudience(id: Long) = Response.success(Unit)
}
