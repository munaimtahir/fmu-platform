package pk.vexel.medsims.core.network

import kotlinx.serialization.json.Json
import retrofit2.Response
import java.io.IOException
import java.net.SocketTimeoutException

sealed interface NetworkResult<out T> {
    data class Success<T>(val value: T): NetworkResult<T>
    data class Failure(
        val kind: ErrorKind,
        val message: String,
        val code: String? = null,
        val reasons: List<String> = emptyList(),
        val outstanding: String? = null,
    ): NetworkResult<Nothing>
}
enum class ErrorKind { OFFLINE, TIMEOUT, VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, SERVER, UNKNOWN }
fun errorKind(code: Int) = when (code) { 400 -> ErrorKind.VALIDATION; 401 -> ErrorKind.UNAUTHORIZED; 403 -> ErrorKind.FORBIDDEN; 404 -> ErrorKind.NOT_FOUND; 409 -> ErrorKind.CONFLICT; in 500..599 -> ErrorKind.SERVER; else -> ErrorKind.UNKNOWN }

private val errorJson = Json { ignoreUnknownKeys = true; explicitNulls = false; isLenient = true }

/** Shared network-call runner used by every repository so error decoding/offline mapping happens once. */
suspend fun <T> safeCall(request: suspend () -> Response<T>): NetworkResult<T> = try {
    val response = request()
    val body = response.body()
    if (response.isSuccessful && body != null) NetworkResult.Success(body) else failure(response)
} catch (e: SocketTimeoutException) { NetworkResult.Failure(ErrorKind.TIMEOUT, "The request timed out. Please try again.") }
  catch (e: IOException) { NetworkResult.Failure(ErrorKind.OFFLINE, "Check your internet connection and try again.") }

fun <T> failure(response: Response<T>): NetworkResult.Failure {
    val envelope = try { response.errorBody()?.string()?.let { errorJson.decodeFromString<ApiErrorEnvelope>(it) } } catch (e: Exception) { null }
    val message = envelope?.error?.message ?: envelope?.message ?: envelope?.detail ?: when (response.code()) { 401 -> "Your credentials or session are invalid."; 403 -> "You do not have permission for this action."; else -> "The service could not complete your request. Please try again." }
    val code = envelope?.error?.code ?: envelope?.code
    return NetworkResult.Failure(errorKind(response.code()), message, code, envelope?.reasons.orEmpty(), envelope?.outstanding)
}
