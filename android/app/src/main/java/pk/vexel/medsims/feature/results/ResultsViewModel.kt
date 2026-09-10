package pk.vexel.medsims.feature.results

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.academic.AcademicRepository
import pk.vexel.medsims.core.network.LatestResultDto
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.ScreenState
import javax.inject.Inject

@HiltViewModel class ResultsViewModel @Inject constructor(private val repository: AcademicRepository): ViewModel() {
    private val _state = MutableStateFlow<ScreenState<List<LatestResultDto>>>(ScreenState.Loading); val state = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = ScreenState.Loading
        _state.value = when (val result = repository.home()) {
            is NetworkResult.Success -> ScreenState.Content(result.value.latest_results)
            is NetworkResult.Failure -> ScreenState.Error(result.kind, result.message, result.code)
        }
    } }
}
