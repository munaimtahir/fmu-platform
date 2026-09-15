package pk.vexel.medsims.core.network

import kotlinx.serialization.Serializable

@Serializable data class StudentIdentityDto(val id: Long, val reg_no: String, val display_name: String)
@Serializable data class AcademicPlacementDto(val programme: String? = null, val batch: String? = null, val group: String? = null, val status: String)
@Serializable data class AttendanceSummaryDto(val total: Int, val present: Int, val absent: Int, val late: Int, val leave: Int, val percentage: Double)
@Serializable data class LatestResultDto(val exam_id: Long, val exam_title: String, val status: String, val final_outcome: String? = null, val total_obtained: String? = null)
@Serializable data class ScheduleEntryDto(
    val id: Long, val date: String, val day_of_week: Int, val day_name: String? = null,
    val start_time: String? = null, val end_time: String? = null, val time_slot: String? = null,
    val course_code: String? = null, val course_name: String? = null, val faculty_name: String? = null,
    val room: String? = null, val status: String, val notes: String? = null, val source: String,
)
@Serializable data class StudentHomeResponse(
    val student: StudentIdentityDto,
    val academic_placement: AcademicPlacementDto,
    val attendance_summary: AttendanceSummaryDto,
    val latest_results: List<LatestResultDto>,
    val today_schedule: List<ScheduleEntryDto>,
)
@Serializable data class StudentTimetableResponse(val week_start_date: String, val entries: List<ScheduleEntryDto>, val source: String)

/** Generic DRF `PageNumberPagination` envelope: `{count, next, previous, results}`. */
@Serializable data class PaginatedResponse<T>(val count: Int, val next: String? = null, val previous: String? = null, val results: List<T>)

/** One row from `GET /api/attendance/` — distinct from the home screen's [AttendanceSummaryDto] aggregate. */
@Serializable data class AttendanceRecordDto(
    val id: Long, val session: Long, val student: Long,
    val student_reg_no: String? = null, val student_name: String? = null, val session_department: String? = null,
    val status: String, val marked_by_username: String? = null, val marked_at: String? = null, val created_at: String,
)

/** One row from `GET /api/results/` — distinct from the home screen's [LatestResultDto] summary. */
@Serializable data class ResultRecordDto(
    val id: Long, val exam: Long, val exam_title: String? = null, val student: Long,
    val student_reg_no: String? = null, val student_name: String? = null,
    val total_obtained: String? = null, val total_max: String? = null,
    val final_outcome: String? = null, val status: String, val created_at: String,
)

@Serializable data class NotificationDto(val id: Long, val title: String, val body: String, val category: String, val priority: String, val created_at: String)
@Serializable data class NotificationInboxDto(val id: Long, val notification: NotificationDto, val delivered_at: String, val read_at: String? = null, val is_deleted: Boolean = false)
@Serializable data class UnreadCountDto(val count: Int)
@Serializable data class MarkedReadDto(val marked_read: Int)
@Serializable data class LearningMaterialAudienceDto(
    val id: Long,
    val material: Long,
    val program: Long? = null,
    val batch: Long? = null,
    val term: Long? = null,
    val course: Long? = null,
    val section: Long? = null,
)
@Serializable data class LearningMaterialDto(
    val id: Long,
    val title: String,
    val description: String = "",
    val kind: String,
    val file: String? = null,
    val url: String? = null,
    val mime_type: String? = null,
    val size_bytes: Long? = null,
    val status: String = "PUBLISHED",
    val published_at: String? = null,
    val available_from: String? = null,
    val available_until: String? = null,
    val created_by: Long? = null,
    val audiences: List<LearningMaterialAudienceDto> = emptyList(),
)
@Serializable data class RequirementSubmissionDto(val id: Long, val file: String? = null, val value: String? = null, val created_at: String)
@Serializable data class RequirementDto(val id: Long, val definition_title: String, val definition_description: String = "", val definition_type: String, val status: String, val due_at: String? = null, val notes: String? = null, val is_locked: Boolean, val submissions: List<RequirementSubmissionDto> = emptyList())
@Serializable data class StudentFinanceSummaryDto(val student_id: Long, val outstanding: String, val total_debits: String, val total_credits: String, val voucher_statuses: Map<String, String> = emptyMap())

@Serializable data class FacultyDashboardDto(
    val my_sessions: Int = 0,
    val my_students: Int = 0,
    val draft_results: Int = 0,
)
@Serializable data class FacultySessionDto(
    val id: Long,
    val academic_period: Long,
    val academic_period_name: String? = null,
    val group: Long,
    val group_name: String? = null,
    val faculty: Long? = null,
    val faculty_name: String? = null,
    val department: Long,
    val department_name: String? = null,
    val starts_at: String,
    val ends_at: String,
)
@Serializable data class LiveRosterStudentDto(
    val student_id: Long,
    val reg_no: String,
    val name: String,
    val status: String? = null,
    val default_status: String = "P",
)
@Serializable data class LiveRosterDto(
    val session: Long,
    val section: Long,
    val date: String,
    val default_status: String = "P",
    val students: List<LiveRosterStudentDto>,
)
@Serializable data class LiveAttendanceRecordDto(val student_id: Long, val status: String)
@Serializable data class LiveAttendanceRequest(
    val session_id: Long,
    val date: String,
    val default_status: String = "P",
    val records: List<LiveAttendanceRecordDto>,
)
@Serializable data class LiveAttendanceResultDto(
    val total: Int,
    val present: Int? = null,
    val absent: Int? = null,
    val created: Int? = null,
    val updated: Int? = null,
    val audit_summary: String? = null,
)

@Serializable data class FacultyStudentDto(
    val id: Long,
    val reg_no: String,
    val name: String,
    val group: Long? = null,
    val group_name: String? = null,
)
@Serializable data class FacultyExamComponentDto(
    val id: Long,
    val exam: Long,
    val name: String,
    val sequence: Int = 0,
    val max_marks: String,
)
@Serializable data class FacultyExamDto(
    val id: Long,
    val academic_period: Long,
    val academic_period_name: String? = null,
    val title: String,
    val published: Boolean = false,
    val components: List<FacultyExamComponentDto> = emptyList(),
)
@Serializable data class FacultyResultComponentDto(
    val id: Long,
    val result_header: Long,
    val exam_component: Long,
    val exam_component_name: String = "",
    val exam_component_max_marks: String = "0",
    val marks_obtained: String = "0",
    val component_outcome: String = "NA",
)
@Serializable data class FacultyResultDto(
    val id: Long,
    val exam: Long,
    val exam_title: String = "",
    val student: Long,
    val student_reg_no: String = "",
    val student_name: String = "",
    val total_obtained: String = "0",
    val total_max: String = "0",
    val final_outcome: String = "PENDING",
    val status: String = "DRAFT",
    val component_entries: List<FacultyResultComponentDto> = emptyList(),
)
@Serializable data class FacultyResultWriteRequest(
    val exam: Long,
    val student: Long,
    val total_obtained: String,
    val total_max: String,
    val status: String = "DRAFT",
)
@Serializable data class FacultyResultUpdateRequest(val total_obtained: String, val total_max: String)
@Serializable data class FacultyComponentWriteRequest(
    val result_header: Long? = null,
    val exam_component: Long? = null,
    val marks_obtained: String,
)
@Serializable data class FacultySectionDto(
    val id: Long,
    val name: String,
    val course: Long,
    val course_code: String? = null,
    val course_name: String? = null,
    val academic_period: Long,
    val academic_period_name: String? = null,
    val group: Long? = null,
    val group_name: String? = null,
)
@Serializable data class FacultyMaterialLinkRequest(
    val title: String,
    val description: String = "",
    val kind: String = "LINK",
    val url: String,
    val available_from: String? = null,
    val available_until: String? = null,
)
@Serializable data class FacultyMaterialUpdateRequest(
    val title: String,
    val description: String = "",
    val url: String? = null,
    val available_from: String? = null,
    val available_until: String? = null,
)
@Serializable data class FacultyAudienceRequest(val section: Long)
@Serializable data object EmptyRequest
