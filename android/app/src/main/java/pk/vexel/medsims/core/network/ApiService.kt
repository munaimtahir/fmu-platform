package pk.vexel.medsims.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AuthApi {
    @POST("api/auth/login/") suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    @POST("api/auth/refresh/") suspend fun refresh(@Body request: RefreshRequest): Response<RefreshResponse>
    @POST("api/auth/logout/") suspend fun logout(@Body request: LogoutRequest): Response<Unit>
    @GET("api/auth/me/") suspend fun me(): Response<UserDto>
}
interface HealthApi { @GET("api/health/") suspend fun health(): Response<HealthResponse> }
interface MobileApi {
    @GET("api/mobile/student/home/") suspend fun studentHome(): Response<StudentHomeResponse>
    @GET("api/mobile/student/timetable/") suspend fun studentTimetable(@Query("week_start_date") weekStartDate: String? = null): Response<StudentTimetableResponse>
}
