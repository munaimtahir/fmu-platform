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
