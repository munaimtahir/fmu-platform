package pk.vexel.medsims.core.network

import dagger.Binds
import dagger.Module
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import javax.inject.Singleton

/**
 * Test replacement for [NetworkModule]. Nothing in the app injects `Retrofit`/`OkHttpClient`/`Json`
 * directly (only the five API interfaces below), so this module only needs to bind those five to
 * their fakes — no MockWebServer or real networking required, which keeps instrumented tests
 * hermetic and fast.
 */
@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [NetworkModule::class])
abstract class FakeNetworkModule {
    @Binds @Singleton abstract fun bindAuthApi(impl: FakeAuthApi): AuthApi
    @Binds @Singleton abstract fun bindHealthApi(impl: FakeHealthApi): HealthApi
    @Binds @Singleton abstract fun bindMobileApi(impl: FakeMobileApi): MobileApi
    @Binds @Singleton abstract fun bindAttendanceApi(impl: FakeAttendanceApi): AttendanceApi
    @Binds @Singleton abstract fun bindResultsApi(impl: FakeResultsApi): ResultsApi
}
