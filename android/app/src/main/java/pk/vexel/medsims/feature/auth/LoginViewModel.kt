package pk.vexel.medsims.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.auth.AuthRepository
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.UserDto
import javax.inject.Inject

data class LoginUiState(val identifier: String = "", val password: String = "", val passwordVisible: Boolean = false, val loading: Boolean = false, val error: String? = null, val user: UserDto? = null)
@HiltViewModel class LoginViewModel @Inject constructor(private val repository: AuthRepository): ViewModel() {
    private val _state = MutableStateFlow(LoginUiState()); val state = _state.asStateFlow()
    fun updateIdentifier(value: String) { _state.value = _state.value.copy(identifier = value, error = null) }
    fun updatePassword(value: String) { _state.value = _state.value.copy(password = value, error = null) }
    fun togglePassword() { _state.value = _state.value.copy(passwordVisible = !_state.value.passwordVisible) }
    fun login() { val current = _state.value; if (current.identifier.isBlank() || current.password.isBlank()) { _state.value = current.copy(error = "Enter your identifier and password."); return }; viewModelScope.launch { _state.value = current.copy(loading = true, error = null); when (val result = repository.login(current.identifier.trim(), current.password)) { is NetworkResult.Success -> _state.value = _state.value.copy(loading = false, user = result.value); is NetworkResult.Failure -> _state.value = _state.value.copy(loading = false, error = result.message) } } }
}
