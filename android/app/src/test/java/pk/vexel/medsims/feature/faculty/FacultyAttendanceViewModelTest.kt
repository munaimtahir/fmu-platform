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
}

private class FakeFacultyDataSource : FacultyDataSource {
    private val session = FacultySessionDto(9, 1, group = 2, department = 3, starts_at = "2026-09-15T09:00:00Z", ends_at = "2026-09-15T10:00:00Z")
    private val roster = LiveRosterDto(9, 2, "2026-09-15", students = listOf(LiveRosterStudentDto(1, "S1", "Jane", "P"), LiveRosterStudentDto(2, "S2", "Ali", "P")))
    var rosterResult: NetworkResult<LiveRosterDto> = NetworkResult.Success(roster)
    var lastSubmit: LiveAttendanceRequest? = null
    override suspend fun dashboard(): NetworkResult<FacultyDashboardDto> = NetworkResult.Success(FacultyDashboardDto())
    override suspend fun sessions(page: Int?): NetworkResult<PaginatedResponse<FacultySessionDto>> = NetworkResult.Success(PaginatedResponse(1, results = listOf(session)))
    override suspend fun roster(sessionId: Long) = rosterResult
    override suspend fun submit(request: LiveAttendanceRequest): NetworkResult<LiveAttendanceResultDto> { lastSubmit = request; return NetworkResult.Success(LiveAttendanceResultDto(2)) }
}
