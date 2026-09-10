package pk.vexel.medsims.core.auth

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import pk.vexel.medsims.core.network.*
import javax.inject.Inject
import javax.inject.Singleton

sealed interface SessionState { data object Initializing: SessionState; data object Unauthenticated: SessionState; data class Authenticated(val user: UserDto): SessionState; data object Expired: SessionState }

@Singleton
class AuthRepository @Inject constructor(private val api: AuthApi, private val store: SessionStore): TokenRefresher {
    private val refreshMutex = Mutex()
    suspend fun login(identifier: String, password: String): NetworkResult<UserDto> = when (val result = safeCall { api.login(LoginRequest(identifier, password)) }) {
        is NetworkResult.Success -> { store.save(result.value.tokens.access, result.value.tokens.refresh); NetworkResult.Success(result.value.user) }
        is NetworkResult.Failure -> result
    }
    suspend fun restore(): SessionState {
        if (store.refreshToken().isNullOrBlank()) return SessionState.Unauthenticated
        return when (val refresh = refresh()) { is NetworkResult.Success -> when (val me = me()) { is NetworkResult.Success -> SessionState.Authenticated(me.value); is NetworkResult.Failure -> { store.clear(); SessionState.Expired } }; is NetworkResult.Failure -> { store.clear(); SessionState.Expired } }
    }
    suspend fun me(): NetworkResult<UserDto> = safeCall { api.me() }
    override suspend fun refresh(): NetworkResult<Unit> = refreshMutex.withLock {
        val token = store.refreshToken() ?: return@withLock NetworkResult.Failure(ErrorKind.UNAUTHORIZED, "Your session has expired.")
        when (val result = safeCall { api.refresh(RefreshRequest(token)) }) {
            is NetworkResult.Success -> { store.save(result.value.access, result.value.refresh ?: token); NetworkResult.Success(Unit) }
            is NetworkResult.Failure -> result
        }
    }
    suspend fun logout() { val refresh = store.refreshToken(); try { api.logout(LogoutRequest(refresh)) } catch (_: Exception) { } finally { store.clear() } }
}
