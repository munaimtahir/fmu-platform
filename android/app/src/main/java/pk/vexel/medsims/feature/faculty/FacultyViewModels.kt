package pk.vexel.medsims.feature.faculty

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.faculty.FacultyDataSource
import pk.vexel.medsims.core.network.*
import javax.inject.Inject

data class FacultyHomeState(val loading: Boolean = true, val stats: FacultyDashboardDto? = null, val error: String? = null)

@HiltViewModel class FacultyHomeViewModel @Inject constructor(private val repository: FacultyDataSource): ViewModel() {
    private val _state = MutableStateFlow(FacultyHomeState()); val state = _state.asStateFlow()
    fun load() = viewModelScope.launch {
        _state.value = FacultyHomeState()
        _state.value = when (val result = repository.dashboard()) {
            is NetworkResult.Success -> FacultyHomeState(false, result.value)
            is NetworkResult.Failure -> FacultyHomeState(false, error = result.message)
        }
    }
}

data class FacultyAttendanceState(
    val loading: Boolean = true,
    val sessions: List<FacultySessionDto> = emptyList(),
    val sessionNextPage: Int? = null,
    val selectedSessionId: Long? = null,
    val roster: LiveRosterDto? = null,
    val statuses: Map<Long, String> = emptyMap(),
    val search: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel class FacultyAttendanceViewModel @Inject constructor(private val repository: FacultyDataSource): ViewModel() {
    private val _state = MutableStateFlow(FacultyAttendanceState()); val state = _state.asStateFlow()
    fun loadSessions() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        when (val result = repository.sessions()) {
            is NetworkResult.Success -> {
                val sessions = result.value.results
                _state.value = _state.value.copy(loading = false, sessions = sessions, sessionNextPage = nextPage(result.value.next))
                sessions.firstOrNull()?.let { selectSession(it.id) }
            }
            is NetworkResult.Failure -> _state.value = _state.value.copy(loading = false, error = result.message)
        }
    }
    fun loadMoreSessions() = viewModelScope.launch {
        val page = _state.value.sessionNextPage ?: return@launch
        when (val result = repository.sessions(page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                sessions = (_state.value.sessions + result.value.results).distinctBy { it.id },
                sessionNextPage = nextPage(result.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = result.message)
        }
    }
    fun selectSession(id: Long) {
        _state.value = _state.value.copy(selectedSessionId = id, roster = null, statuses = emptyMap(), error = null, message = null)
        loadRoster(id)
    }
    fun search(value: String) { _state.value = _state.value.copy(search = value) }
    fun toggle(studentId: Long) {
        val current = _state.value.statuses[studentId] ?: "P"
        _state.value = _state.value.copy(statuses = _state.value.statuses + (studentId to if (current == "A") "P" else "A"))
    }
    fun markAll(status: String) {
        val ids = _state.value.roster?.students.orEmpty().associate { it.student_id to status }
        _state.value = _state.value.copy(statuses = ids)
    }
    fun submit() = viewModelScope.launch {
        val roster = _state.value.roster ?: return@launch
        if (_state.value.submitting) return@launch
        val records = roster.students.filter { _state.value.statuses[it.student_id] == "A" }.map { LiveAttendanceRecordDto(it.student_id, "A") }
        _state.value = _state.value.copy(submitting = true, error = null, message = null)
        when (val result = repository.submit(LiveAttendanceRequest(roster.session, roster.date, "P", records))) {
            is NetworkResult.Success -> {
                _state.value = _state.value.copy(submitting = false, message = "Attendance saved for ${result.value.total} students.")
                loadRoster(roster.session)
            }
            is NetworkResult.Failure -> _state.value = _state.value.copy(submitting = false, error = result.message)
        }
    }
    private fun loadRoster(id: Long) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        when (val result = repository.roster(id)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                loading = false,
                roster = result.value,
                statuses = result.value.students.associate { it.student_id to (it.status ?: result.value.default_status) },
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(loading = false, error = result.message)
        }
    }
    private fun nextPage(next: String?): Int? = next?.substringAfter("page=", "")?.substringBefore('&')?.toIntOrNull()
}
