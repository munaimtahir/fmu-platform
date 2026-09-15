package pk.vexel.medsims.core.network

import kotlinx.serialization.Serializable

@Serializable data class LoginRequest(val identifier: String, val password: String)
@Serializable data class TokenPair(val access: String, val refresh: String)
@Serializable data class RefreshRequest(val refresh: String)
@Serializable data class RefreshResponse(val access: String, val refresh: String? = null)
@Serializable data class LogoutRequest(val refresh: String? = null)
@Serializable data class PasswordChangeRequest(val old_password: String, val new_password: String, val new_password_confirm: String)
@Serializable data class ProfileUpdateRequest(val first_name: String? = null, val last_name: String? = null, val email: String? = null)
@Serializable data class MessageResponse(val message: String)
@Serializable data class UserDto(val id: Long, val username: String, val email: String = "", val full_name: String = "", val role: String = "User", val student_id: Long? = null, val is_active: Boolean = true)
@Serializable data class AccessRoleDto(val id:Long,val name:String,val description:String="")
@Serializable data class AccessTaskDto(val id:Long,val code:String,val name:String="",val module:String="")
@Serializable data class AccessProfileDto(val phone:String?=null,val date_of_birth:String?=null)
@Serializable data class AccessContextDto(val id:Long,val username:String,val email:String="",val first_name:String="",val last_name:String="",val is_active:Boolean=true,val roles:List<AccessRoleDto> = emptyList(),val tasks:List<AccessTaskDto> = emptyList(),val profile:AccessProfileDto?=null)
@Serializable data class LoginResponse(val user: UserDto, val tokens: TokenPair)
@Serializable data class HealthResponse(val status: String)
/**
 * Most API errors are wrapped as `{"error": {"code", "message"}}` (see `error()`), but some
 * DRF exceptions (e.g. `PermissionDenied(detail={...})`) are returned as a flat dict body —
 * `{"code", "message", "reasons", "outstanding"}` for FINANCE_BLOCKED — with no "error" wrapper.
 * Both shapes are decoded here so `failure()` can prefer the nested one and fall back to the flat one.
 */
@Serializable data class ApiErrorEnvelope(
    val error: ApiError? = null,
    val detail: String? = null,
    val code: String? = null,
    val message: String? = null,
    val reasons: List<String>? = null,
    val outstanding: String? = null,
)
@Serializable data class ApiError(val code: String? = null, val message: String? = null)

enum class AppRole { ADMIN, REGISTRAR, EXAM_CELL, FINANCE, FACULTY, STUDENT, COORDINATOR, OFFICE_ASSISTANT, USER, UNKNOWN }
fun normalizeRole(value: String?): AppRole = when (value?.trim()?.lowercase()?.replace(" ", "")?.replace("_", "")) {
    "admin" -> AppRole.ADMIN; "registrar" -> AppRole.REGISTRAR; "examcell" -> AppRole.EXAM_CELL
    "finance" -> AppRole.FINANCE; "faculty" -> AppRole.FACULTY; "student" -> AppRole.STUDENT
    "coordinator" -> AppRole.COORDINATOR; "officeassistant" -> AppRole.OFFICE_ASSISTANT
    "user", null, "" -> AppRole.USER; else -> AppRole.UNKNOWN
}
