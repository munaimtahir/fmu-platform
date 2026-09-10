package pk.vexel.medsims.core.auth

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module @InstallIn(SingletonComponent::class)
abstract class AuthBindingModule {
    @Binds abstract fun bindTokenRefresher(impl: AuthRepository): TokenRefresher
}
