package pk.vexel.medsims.core.network

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
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
        val fieldErrors: Map<String, String> = emptyMap(),
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
    val raw = try { response.errorBody()?.string() } catch (e: Exception) { null }
    val envelope = try { raw?.let { errorJson.decodeFromString<ApiErrorEnvelope>(it) } } catch (e: Exception) { null }
    val fields = try {
        val root = raw?.let { errorJson.parseToJsonElement(it) as? JsonObject }.orEmpty()
        root.filterKeys { it !in setOf("error", "detail", "code", "message", "reasons", "outstanding") }
            .mapNotNull { (name, value) ->
                val text = when (value) { is JsonArray -> value.firstOrNull()?.jsonPrimitive?.content; else -> value.jsonPrimitive.content }
                text?.let { name to it }
            }.toMap()
    } catch (_: Exception) { emptyMap() }
    val message = envelope?.error?.message ?: envelope?.message ?: envelope?.detail ?: when (response.code()) { 401 -> "Your credentials or session are invalid."; 403 -> "You do not have permission for this action."; else -> "The service could not complete your request. Please try again." }
    val code = envelope?.error?.code ?: envelope?.code
    return NetworkResult.Failure(errorKind(response.code()), message, code, envelope?.reasons.orEmpty(), envelope?.outstanding, fields)
}
