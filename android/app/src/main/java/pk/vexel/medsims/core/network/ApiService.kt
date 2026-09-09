package pk.vexel.medsims.core.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/login/") suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    @POST("api/auth/refresh/") suspend fun refresh(@Body request: RefreshRequest): Response<RefreshResponse>
    @POST("api/auth/logout/") suspend fun logout(@Body request: LogoutRequest): Response<Unit>
    @GET("api/auth/me/") suspend fun me(): Response<UserDto>
}
interface HealthApi { @GET("api/health/") suspend fun health(): Response<HealthResponse> }
