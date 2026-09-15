package pk.vexel.medsims.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Query
import retrofit2.http.Multipart
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Url
import retrofit2.http.Streaming
import retrofit2.http.HTTP
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import kotlinx.serialization.json.JsonElement

interface AuthApi {
    @POST("api/auth/login/") suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    @POST("api/auth/refresh/") suspend fun refresh(@Body request: RefreshRequest): Response<RefreshResponse>
    @POST("api/auth/logout/") suspend fun logout(@Body request: LogoutRequest): Response<Unit>
    @GET("api/auth/me/") suspend fun me(): Response<UserDto>
    @PATCH("api/auth/me/") suspend fun updateProfile(@Body request: ProfileUpdateRequest): Response<UserDto>
    @POST("api/auth/change-password/") suspend fun changePassword(@Body request: PasswordChangeRequest): Response<MessageResponse>
}
interface HealthApi { @GET("api/health/") suspend fun health(): Response<HealthResponse> }
interface CoreApi { @GET("api/core/users/me/") suspend fun accessContext():Response<AccessContextDto> }
interface MobileApi {
    @GET("api/mobile/student/home/") suspend fun studentHome(): Response<StudentHomeResponse>
    @GET("api/mobile/student/timetable/") suspend fun studentTimetable(@Query("week_start_date") weekStartDate: String? = null): Response<StudentTimetableResponse>
}
interface AttendanceApi {
    @GET("api/attendance/") suspend fun list(
        @Query("student") studentId: Long,
        @Query("ordering") ordering: String = "-marked_at",
        @Query("page") page: Int? = null,
    ): Response<PaginatedResponse<AttendanceRecordDto>>
}
interface ResultsApi {
    @GET("api/results/") suspend fun list(
        @Query("student") studentId: Long,
        @Query("ordering") ordering: String = "-created_at",
        @Query("page") page: Int? = null,
    ): Response<PaginatedResponse<ResultRecordDto>>
}
interface StudentApi {
    @GET("api/my/notifications/") suspend fun notifications(@Query("page") page: Int? = null): Response<PaginatedResponse<NotificationInboxDto>>
    @POST("api/my/notifications/{id}/read/") suspend fun markNotificationRead(@retrofit2.http.Path("id") id: Long): Response<NotificationInboxDto>
    @POST("api/my/notifications/read-all/") suspend fun markAllNotificationsRead(): Response<MarkedReadDto>
    @GET("api/my/notifications/unread-count/") suspend fun unreadCount(): Response<UnreadCountDto>
    @GET("api/learning/student-feed/") suspend fun learningFeed(): Response<List<LearningMaterialDto>>
    @GET("api/compliance/my-compliance/") suspend fun compliance(@Query("page") page: Int? = null): Response<PaginatedResponse<RequirementDto>>
    @Multipart @POST("api/compliance/my-compliance/{id}/submit/") suspend fun submitCompliance(
        @Path("id") id: Long,
        @Part file: MultipartBody.Part? = null,
        @Part("value") value: RequestBody? = null,
    ): Response<RequirementDto>
    @GET("api/finance/students/{id}/") suspend fun finance(@Path("id") id: Long): Response<StudentFinanceSummaryDto>
    @Streaming @GET("api/finance/students/{id}/statement/pdf/") suspend fun statementPdf(@Path("id") id: Long): Response<ResponseBody>
    @Streaming @GET suspend fun download(@Url url: String): Response<ResponseBody>
}

interface FacultyApi {
    @GET("api/dashboard/stats/") suspend fun dashboard(): Response<FacultyDashboardDto>
    @GET("api/timetable/sessions/") suspend fun sessions(
        @Query("ordering") ordering: String = "starts_at",
        @Query("page") page: Int? = null,
    ): Response<PaginatedResponse<FacultySessionDto>>
    @GET("api/attendance-input/live/roster/") suspend fun roster(@Query("session_id") sessionId: Long): Response<LiveRosterDto>
    @POST("api/attendance-input/live/submit/") suspend fun submitAttendance(@Body request: LiveAttendanceRequest): Response<LiveAttendanceResultDto>
}

/** Dynamic transport for the shared staff APIs. Domain repositories still own paths and policy. */
interface StaffApi {
    @GET suspend fun get(@Url url: String): Response<JsonElement>
    @POST suspend fun post(@Url url: String, @Body body: JsonElement): Response<JsonElement>
    @PATCH suspend fun patch(@Url url: String, @Body body: JsonElement): Response<JsonElement>
    @HTTP(method = "DELETE", hasBody = false) suspend fun delete(@Url url: String): Response<Unit>
    @Streaming @GET suspend fun download(@Url url: String): Response<ResponseBody>
    @Multipart @POST suspend fun upload(
        @Url url: String,
        @Part file: MultipartBody.Part,
        @Part("mode") mode: RequestBody,
        @Part("auto_create") autoCreate: RequestBody,
    ): Response<JsonElement>
}
