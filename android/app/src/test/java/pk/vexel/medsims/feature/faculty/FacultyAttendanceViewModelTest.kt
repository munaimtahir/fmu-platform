package pk.vexel.medsims.feature.faculty

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import pk.vexel.medsims.core.faculty.FacultyDataSource
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.*

@OptIn(ExperimentalCoroutinesApi::class)
class FacultyAttendanceViewModelTest {
    private val repository = FakeFacultyDataSource()
    @Before fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After fun tearDown() { Dispatchers.resetMain() }

    @Test fun loads_roster_and_submits_only_absent_students() = runTest {
        val viewModel = FacultyAttendanceViewModel(repository)
        viewModel.loadSessions()
        assertEquals(2, viewModel.state.value.roster?.students?.size)
        viewModel.toggle(2)
        viewModel.submit()
        assertEquals("Attendance saved for 2 students.", viewModel.state.value.message)
        assertEquals(listOf(LiveAttendanceRecordDto(2, "A")), repository.lastSubmit?.records)
    }

    @Test fun surfaces_roster_error_without_queuing() = runTest {
        repository.rosterResult = NetworkResult.Failure(ErrorKind.FORBIDDEN, "No access")
        val viewModel = FacultyAttendanceViewModel(repository)
        viewModel.loadSessions()
        assertEquals("No access", viewModel.state.value.error)
        assertEquals(null, repository.lastSubmit)
    }

    @Test fun gradebook_creates_scoped_draft_and_component_marks() = runTest {
        repository.examsResult = NetworkResult.Success(PaginatedResponse(1, results = listOf(FacultyExamDto(5, 1, title = "Midterm", components = listOf(FacultyExamComponentDto(7, 5, "Written", max_marks = "100"))))))
        repository.studentsResult = NetworkResult.Success(PaginatedResponse(1, results = listOf(FacultyStudentDto(3, "S3", "Amina"))))
        val viewModel = FacultyGradebookViewModel(repository)
        viewModel.load()
        viewModel.save(null, 5, 3, "80", "100", mapOf(7L to "80"))
        assertEquals(FacultyResultWriteRequest(5, 3, "80", "100"), repository.lastCreatedResult)
        assertEquals("80", repository.lastCreatedComponent?.marks_obtained)
        assertEquals("Draft gradebook entry saved.", viewModel.state.value.message)
    }

    @Test fun gradebook_rejects_component_marks_above_maximum() = runTest {
        repository.examsResult = NetworkResult.Success(PaginatedResponse(1, results = listOf(FacultyExamDto(5, 1, title = "Midterm", components = listOf(FacultyExamComponentDto(7, 5, "Written", max_marks = "50"))))))
        val viewModel = FacultyGradebookViewModel(repository)
        viewModel.load()
        viewModel.save(null, 5, 3, "40", "100", mapOf(7L to "60"))
        assertEquals("Component marks must be within their maximum.", viewModel.state.value.error)
        assertEquals(null, repository.lastCreatedResult)
    }

    @Test fun materials_create_link_then_assign_teaching_section() = runTest {
        val viewModel = FacultyMaterialsViewModel(repository)
        viewModel.load()
        viewModel.create("Cardiology", "Notes", "https://example.edu/cardio", null, 9, "", "")
        assertEquals("Cardiology", repository.lastLink?.title)
        assertEquals(9L, repository.lastAudienceSection)
        assertEquals("Draft material and section audience saved.", viewModel.state.value.message)
    }
}

private class FakeFacultyDataSource : FacultyDataSource {
    private val session = FacultySessionDto(9, 1, group = 2, department = 3, starts_at = "2026-09-15T09:00:00Z", ends_at = "2026-09-15T10:00:00Z")
    private val roster = LiveRosterDto(9, 2, "2026-09-15", students = listOf(LiveRosterStudentDto(1, "S1", "Jane", "P"), LiveRosterStudentDto(2, "S2", "Ali", "P")))
    var rosterResult: NetworkResult<LiveRosterDto> = NetworkResult.Success(roster)
    var lastSubmit: LiveAttendanceRequest? = null
    var examsResult: NetworkResult<PaginatedResponse<FacultyExamDto>> = NetworkResult.Success(PaginatedResponse(0, results = emptyList()))
    var studentsResult: NetworkResult<PaginatedResponse<FacultyStudentDto>> = NetworkResult.Success(PaginatedResponse(0, results = emptyList()))
    var gradebookResult: NetworkResult<PaginatedResponse<FacultyResultDto>> = NetworkResult.Success(PaginatedResponse(0, results = emptyList()))
    var lastCreatedResult: FacultyResultWriteRequest? = null
    var lastCreatedComponent: FacultyComponentWriteRequest? = null
    var lastLink: FacultyMaterialLinkRequest? = null
    var lastAudienceSection: Long? = null
    override suspend fun dashboard(): NetworkResult<FacultyDashboardDto> = NetworkResult.Success(FacultyDashboardDto())
    override suspend fun sessions(page: Int?): NetworkResult<PaginatedResponse<FacultySessionDto>> = NetworkResult.Success(PaginatedResponse(1, results = listOf(session)))
    override suspend fun roster(sessionId: Long) = rosterResult
    override suspend fun submit(request: LiveAttendanceRequest): NetworkResult<LiveAttendanceResultDto> { lastSubmit = request; return NetworkResult.Success(LiveAttendanceResultDto(2)) }
    override suspend fun students(search: String?, page: Int?) = studentsResult
    override suspend fun exams(page: Int?) = examsResult
    override suspend fun gradebook(search: String?, page: Int?) = gradebookResult
    override suspend fun createResult(request: FacultyResultWriteRequest): NetworkResult<FacultyResultDto> { lastCreatedResult = request; return NetworkResult.Success(FacultyResultDto(1, request.exam, student = request.student)) }
    override suspend fun updateResult(id: Long, request: FacultyResultUpdateRequest) = NetworkResult.Success(FacultyResultDto(id, 1, student = 1))
    override suspend fun createComponent(request: FacultyComponentWriteRequest): NetworkResult<FacultyResultComponentDto> { lastCreatedComponent = request; return NetworkResult.Success(FacultyResultComponentDto(1, request.result_header ?: 1, request.exam_component ?: 1, marks_obtained = request.marks_obtained)) }
    override suspend fun updateComponent(id: Long, request: FacultyComponentWriteRequest) = NetworkResult.Success(FacultyResultComponentDto(id, 1, 1, marks_obtained = request.marks_obtained))
    override suspend fun deleteComponent(id: Long) = NetworkResult.Success(Unit)
    override suspend fun sections(page: Int?) = NetworkResult.Success(PaginatedResponse<FacultySectionDto>(0, results = emptyList()))
    override suspend fun materials(search: String?, page: Int?) = NetworkResult.Success(PaginatedResponse<LearningMaterialDto>(0, results = emptyList()))
    override suspend fun createLinkMaterial(request: FacultyMaterialLinkRequest): NetworkResult<LearningMaterialDto> { lastLink = request; return NetworkResult.Success(LearningMaterialDto(1, request.title, kind = "LINK", url = request.url, status = "DRAFT")) }
    override suspend fun createFileMaterial(document: PickedDocument, title: String, description: String, availableFrom: String?, availableUntil: String?) = NetworkResult.Success(LearningMaterialDto(1, title, kind = "FILE", status = "DRAFT"))
    override suspend fun updateMaterial(id: Long, request: FacultyMaterialUpdateRequest) = NetworkResult.Success(LearningMaterialDto(id, request.title, kind = "LINK", status = "DRAFT"))
    override suspend fun deleteMaterial(id: Long) = NetworkResult.Success(Unit)
    override suspend fun publishMaterial(id: Long) = NetworkResult.Success(LearningMaterialDto(id, "Published", kind = "LINK"))
    override suspend fun archiveMaterial(id: Long) = NetworkResult.Success(LearningMaterialDto(id, "Archived", kind = "LINK", status = "ARCHIVED"))
    override suspend fun addAudience(materialId: Long, sectionId: Long): NetworkResult<List<LearningMaterialAudienceDto>> { lastAudienceSection = sectionId; return NetworkResult.Success(listOf(LearningMaterialAudienceDto(1, materialId, section = sectionId))) }
    override suspend fun deleteAudience(id: Long) = NetworkResult.Success(Unit)
}
