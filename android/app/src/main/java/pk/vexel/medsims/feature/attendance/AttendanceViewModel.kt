package pk.vexel.medsims.feature.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.academic.AcademicRepository
import pk.vexel.medsims.core.network.AttendanceRecordDto
import pk.vexel.medsims.core.network.AttendanceSummaryDto
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.PagedState
import pk.vexel.medsims.core.network.ScreenState
import javax.inject.Inject

@HiltViewModel class AttendanceViewModel @Inject constructor(private val repository: AcademicRepository): ViewModel() {
    private val _state = MutableStateFlow<ScreenState<AttendanceSummaryDto>>(ScreenState.Loading); val state = _state.asStateFlow()
    private val _history = MutableStateFlow(PagedState<AttendanceRecordDto>()); val history = _history.asStateFlow()
    private var studentId: Long? = null

    init { load() }

    fun load() { viewModelScope.launch {
        _state.value = ScreenState.Loading
        when (val result = repository.home()) {
            is NetworkResult.Success -> {
                studentId = result.value.student.id
                _state.value = ScreenState.Content(result.value.attendance_summary)
                loadHistory(reset = true)
            }
            is NetworkResult.Failure -> _state.value = ScreenState.Error(result.kind, result.message, result.code)
        }
    } }

    /** Fetches the next page of history. Pass [reset] = true to reload from page 1 (e.g. pull-to-retry). */
    fun loadHistory(reset: Boolean = false) {
        val id = studentId ?: return
        val current = _history.value
        if (!reset && (current.isLoading || current.isLoadingMore || current.endReached)) return
        val page = if (reset) 1 else (current.nextPage ?: return)
        viewModelScope.launch {
            _history.value = (if (reset) PagedState() else current).copy(
                isLoading = reset, isLoadingMore = !reset, error = null,
            )
            when (val result = repository.attendanceHistory(id, page)) {
                is NetworkResult.Success -> {
                    val body = result.value
                    val items = if (reset) body.results else _history.value.items + body.results
                    _history.value = PagedState(
                        items = items,
                        nextPage = if (body.next != null) page + 1 else null,
                        endReached = body.next == null,
                    )
                }
                is NetworkResult.Failure -> _history.value = _history.value.copy(isLoading = false, isLoadingMore = false, error = result)
            }
        }
    }
}
