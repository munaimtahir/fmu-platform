package pk.vexel.medsims.feature.timetable

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.academic.AcademicRepository
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.network.StudentTimetableResponse
import pk.vexel.medsims.core.network.toScreenState
import javax.inject.Inject

enum class TimetableMode { TODAY, WEEK }

@HiltViewModel class TimetableViewModel @Inject constructor(private val repository: AcademicRepository): ViewModel() {
    private val _state = MutableStateFlow<ScreenState<StudentTimetableResponse>>(ScreenState.Loading); val state = _state.asStateFlow()
    private val _mode = MutableStateFlow(TimetableMode.TODAY); val mode = _mode.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch { _state.value = ScreenState.Loading; _state.value = repository.timetable().toScreenState() } }
    fun setMode(value: TimetableMode) { _mode.value = value }
}
