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
class SessionViewModel @Inject constructor(private val repository: AuthRepository, private val expiryNotifier: SessionExpiryNotifier): ViewModel() {
    private val _state = MutableStateFlow<SessionState>(SessionState.Initializing)
    val state: StateFlow<SessionState> = _state.asStateFlow()
    val impersonation=repository.impersonation
    init {
        viewModelScope.launch { _state.value = repository.restore() }
        viewModelScope.launch { expiryNotifier.expired.collect { repository.logout(); _state.value = SessionState.Expired } }
    }
    fun authenticated(user: pk.vexel.medsims.core.network.UserDto) { _state.value = SessionState.Authenticated(user);loadAccess(user) }
    fun updateUser(user: pk.vexel.medsims.core.network.UserDto) { val access=(_state.value as? SessionState.Authenticated)?.access;_state.value = SessionState.Authenticated(user,access) }
    private fun loadAccess(user:pk.vexel.medsims.core.network.UserDto)=viewModelScope.launch{when(val result=repository.accessContext()){is pk.vexel.medsims.core.network.NetworkResult.Success->_state.value=SessionState.Authenticated(user,result.value);is pk.vexel.medsims.core.network.NetworkResult.Failure->Unit}}
    fun logout() = viewModelScope.launch { repository.logout(); _state.value = SessionState.Unauthenticated }
}
