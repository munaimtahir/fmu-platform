package pk.vexel.medsims.core.network

import android.util.Log
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import okhttp3.MediaType.Companion.toMediaType
import pk.vexel.medsims.BuildConfig
import pk.vexel.medsims.core.auth.SessionStore
import okhttp3.HttpUrl.Companion.toHttpUrl

private class AuthorizationInterceptor(private val store: SessionStore) : Interceptor {
    private val apiOrigin = BuildConfig.API_BASE_URL.toHttpUrl()
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = store.accessToken()
        val url = chain.request().url
        val sameOrigin = url.scheme == apiOrigin.scheme && url.host == apiOrigin.host && url.port == apiOrigin.port
        val request = if (token.isNullOrBlank() || !sameOrigin || url.encodedPath.endsWith("/refresh/")) chain.request()
        else chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        return chain.proceed(request)
    }
}

@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton fun json(): Json = Json { ignoreUnknownKeys = true; explicitNulls = false }
    @Provides @Singleton fun client(store: SessionStore): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthorizationInterceptor(store))
        .apply { if (BuildConfig.DEBUG) addInterceptor(HttpLoggingInterceptor { Log.d("MedSIMS_HTTP", it) }.apply { level = HttpLoggingInterceptor.Level.BASIC }) }
        .connectTimeout(20, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS).writeTimeout(30, TimeUnit.SECONDS).build()
    @Provides @Singleton fun retrofit(json: Json, client: OkHttpClient): Retrofit = Retrofit.Builder().baseUrl(BuildConfig.API_BASE_URL).client(client).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
    @Provides fun authApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
    @Provides fun healthApi(retrofit: Retrofit): HealthApi = retrofit.create(HealthApi::class.java)
    @Provides fun mobileApi(retrofit: Retrofit): MobileApi = retrofit.create(MobileApi::class.java)
    @Provides fun attendanceApi(retrofit: Retrofit): AttendanceApi = retrofit.create(AttendanceApi::class.java)
    @Provides fun resultsApi(retrofit: Retrofit): ResultsApi = retrofit.create(ResultsApi::class.java)
    @Provides fun studentApi(retrofit: Retrofit): StudentApi = retrofit.create(StudentApi::class.java)
    @Provides fun facultyApi(retrofit: Retrofit): FacultyApi = retrofit.create(FacultyApi::class.java)
}
