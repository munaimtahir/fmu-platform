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

private class AuthorizationInterceptor(private val store: SessionStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = store.accessToken()
        val request = if (token.isNullOrBlank() || chain.request().url.encodedPath.endsWith("/refresh/")) chain.request()
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
}
