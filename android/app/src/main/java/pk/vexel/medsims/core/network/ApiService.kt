package pk.vexel.medsims.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Query

interface AuthApi {
    @POST("api/auth/login/") suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    @POST("api/auth/refresh/") suspend fun refresh(@Body request: RefreshRequest): Response<RefreshResponse>
    @POST("api/auth/logout/") suspend fun logout(@Body request: LogoutRequest): Response<Unit>
    @GET("api/auth/me/") suspend fun me(): Response<UserDto>
    @PATCH("api/auth/me/") suspend fun updateProfile(@Body request: ProfileUpdateRequest): Response<UserDto>
    @POST("api/auth/change-password/") suspend fun changePassword(@Body request: PasswordChangeRequest): Response<MessageResponse>
}
interface HealthApi { @GET("api/health/") suspend fun health(): Response<HealthResponse> }
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
    @POST("api/compliance/my-compliance/{id}/submit/") suspend fun submitCompliance(@retrofit2.http.Path("id") id: Long, @Body body: Map<String, String>): Response<RequirementDto>
    @GET("api/finance/students/{id}/") suspend fun finance(@retrofit2.http.Path("id") id: Long): Response<StudentFinanceSummaryDto>
}
