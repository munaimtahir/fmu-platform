package pk.vexel.medsims.core.network

import kotlinx.serialization.Serializable

@Serializable data class LoginRequest(val identifier: String, val password: String)
@Serializable data class TokenPair(val access: String, val refresh: String)
@Serializable data class RefreshRequest(val refresh: String)
@Serializable data class RefreshResponse(val access: String, val refresh: String? = null)
@Serializable data class LogoutRequest(val refresh: String? = null)
@Serializable data class UserDto(val id: Long, val username: String, val email: String = "", val full_name: String = "", val role: String = "User", val student_id: Long? = null, val is_active: Boolean = true)
@Serializable data class LoginResponse(val user: UserDto, val tokens: TokenPair)
@Serializable data class HealthResponse(val status: String)
@Serializable data class ApiErrorEnvelope(val error: ApiError? = null, val detail: String? = null)
@Serializable data class ApiError(val code: String? = null, val message: String? = null)

enum class AppRole { ADMIN, REGISTRAR, EXAM_CELL, FINANCE, FACULTY, STUDENT, COORDINATOR, OFFICE_ASSISTANT, USER, UNKNOWN }
fun normalizeRole(value: String?): AppRole = when (value?.trim()?.lowercase()?.replace(" ", "")?.replace("_", "")) {
    "admin" -> AppRole.ADMIN; "registrar" -> AppRole.REGISTRAR; "examcell" -> AppRole.EXAM_CELL
    "finance" -> AppRole.FINANCE; "faculty" -> AppRole.FACULTY; "student" -> AppRole.STUDENT
    "coordinator" -> AppRole.COORDINATOR; "officeassistant" -> AppRole.OFFICE_ASSISTANT
    "user", null, "" -> AppRole.USER; else -> AppRole.UNKNOWN
}
