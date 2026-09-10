package pk.vexel.medsims.feature.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.academic.AcademicRepository
import pk.vexel.medsims.core.network.AttendanceSummaryDto
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.ScreenState
import javax.inject.Inject

@HiltViewModel class AttendanceViewModel @Inject constructor(private val repository: AcademicRepository): ViewModel() {
    private val _state = MutableStateFlow<ScreenState<AttendanceSummaryDto>>(ScreenState.Loading); val state = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = ScreenState.Loading
        _state.value = when (val result = repository.home()) {
            is NetworkResult.Success -> ScreenState.Content(result.value.attendance_summary)
            is NetworkResult.Failure -> ScreenState.Error(result.kind, result.message, result.code)
        }
    } }
}
