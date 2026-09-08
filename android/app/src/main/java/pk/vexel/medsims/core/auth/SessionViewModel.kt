package pk.vexel.medsims.core.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SessionViewModel @Inject constructor(private val repository: AuthRepository): ViewModel() {
    private val _state = MutableStateFlow<SessionState>(SessionState.Initializing)
    val state: StateFlow<SessionState> = _state.asStateFlow()
    init { viewModelScope.launch { _state.value = repository.restore() } }
    fun authenticated(user: pk.vexel.medsims.core.network.UserDto) { _state.value = SessionState.Authenticated(user) }
    fun logout() = viewModelScope.launch { repository.logout(); _state.value = SessionState.Unauthenticated }
}
