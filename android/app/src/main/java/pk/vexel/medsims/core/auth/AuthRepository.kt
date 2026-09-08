package pk.vexel.medsims.core.auth

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

sealed interface SessionState { data object Initializing: SessionState; data object Unauthenticated: SessionState; data class Authenticated(val user: UserDto): SessionState; data object Expired: SessionState }

@Singleton
class AuthRepository @Inject constructor(private val api: AuthApi, private val store: SessionStore) {
    private val refreshMutex = Mutex()
    suspend fun login(identifier: String, password: String): NetworkResult<UserDto> = try {
        val response = api.login(LoginRequest(identifier, password))
        response.body()?.let { store.save(it.tokens.access, it.tokens.refresh); NetworkResult.Success(it.user) } ?: failure(response)
    } catch (e: IOException) { NetworkResult.Failure(ErrorKind.OFFLINE, "Check your internet connection and try again.") }
    suspend fun restore(): SessionState {
        if (store.refreshToken().isNullOrBlank()) return SessionState.Unauthenticated
        return when (val refresh = refresh()) { is NetworkResult.Success -> when (val me = me()) { is NetworkResult.Success -> SessionState.Authenticated(me.value); is NetworkResult.Failure -> { store.clear(); SessionState.Expired } }; is NetworkResult.Failure -> { store.clear(); SessionState.Expired } }
    }
    suspend fun me(): NetworkResult<UserDto> = try { val response = api.me(); response.body()?.let { NetworkResult.Success(it) } ?: failure(response) } catch (e: IOException) { NetworkResult.Failure(ErrorKind.OFFLINE, "Unable to reach MedSIMS.") }
    suspend fun refresh(): NetworkResult<Unit> = refreshMutex.withLock {
        val token = store.refreshToken() ?: return@withLock NetworkResult.Failure(ErrorKind.UNAUTHORIZED, "Your session has expired.")
        try { val response = api.refresh(RefreshRequest(token)); response.body()?.let { store.save(it.access, it.refresh ?: token); NetworkResult.Success(Unit) } ?: failure(response) } catch (e: IOException) { NetworkResult.Failure(ErrorKind.OFFLINE, "Unable to refresh your session.") }
    }
    suspend fun logout() { val refresh = store.refreshToken(); try { api.logout(LogoutRequest(refresh)) } catch (_: Exception) { } finally { store.clear() } }
    private fun <T> failure(response: Response<T>): NetworkResult.Failure = NetworkResult.Failure(errorKind(response.code()), when (response.code()) { 401 -> "Your credentials or session are invalid."; 403 -> "You do not have permission for this action."; else -> "The service could not complete your request. Please try again." })
}
