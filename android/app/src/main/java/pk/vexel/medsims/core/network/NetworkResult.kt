package pk.vexel.medsims.core.network

sealed interface NetworkResult<out T> { data class Success<T>(val value: T): NetworkResult<T>; data class Failure(val kind: ErrorKind, val message: String): NetworkResult<Nothing> }
enum class ErrorKind { OFFLINE, TIMEOUT, VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, SERVER, UNKNOWN }
fun errorKind(code: Int) = when (code) { 400 -> ErrorKind.VALIDATION; 401 -> ErrorKind.UNAUTHORIZED; 403 -> ErrorKind.FORBIDDEN; 404 -> ErrorKind.NOT_FOUND; 409 -> ErrorKind.CONFLICT; in 500..599 -> ErrorKind.SERVER; else -> ErrorKind.UNKNOWN }
