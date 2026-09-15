package pk.vexel.medsims.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.auth.ProfileRepository
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.UserDto
import javax.inject.Inject

@HiltViewModel class ProfileViewModel @Inject constructor(private val auth: ProfileRepository): ViewModel() {
    data class FormState(val message: String? = null, val emailError: String? = null, val passwordError: String? = null, val saving: Boolean = false)
    private val _form = MutableStateFlow(FormState()); val form = _form.asStateFlow()
    fun changePassword(oldPassword: String, newPassword: String, confirmation: String) = viewModelScope.launch {
        if (oldPassword.isBlank()) { _form.value = FormState(passwordError = "Current password is required."); return@launch }
        if (newPassword.length < 8) { _form.value = FormState(passwordError = "New password must be at least 8 characters."); return@launch }
        if (newPassword != confirmation) { _form.value = FormState(passwordError = "New passwords do not match."); return@launch }
        _form.value = FormState(saving = true)
        _form.value = when (val result = auth.changePassword(oldPassword, newPassword, confirmation)) {
            is NetworkResult.Success -> FormState(message = result.value.message)
            is NetworkResult.Failure -> FormState(passwordError = result.fieldErrors["old_password"] ?: result.fieldErrors["new_password"] ?: result.message)
        }
    }
    fun updateEmail(email: String, onUpdated: (UserDto) -> Unit) = viewModelScope.launch {
        if (!EMAIL_PATTERN.matches(email.trim())) { _form.value = FormState(emailError = "Enter a valid email address."); return@launch }
        _form.value = FormState(saving = true)
        _form.value = when (val result = auth.updateProfile(email)) {
            is NetworkResult.Success -> { onUpdated(result.value); FormState(message = "Profile updated.") }
            is NetworkResult.Failure -> FormState(emailError = result.fieldErrors["email"] ?: result.message)
        }
    }
    private companion object { val EMAIL_PATTERN = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") }
}
