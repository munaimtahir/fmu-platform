package pk.vexel.medsims.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pk.vexel.medsims.BuildConfig
import pk.vexel.medsims.core.network.UserDto
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer
import androidx.hilt.navigation.compose.hiltViewModel

@Composable fun ProfileScreen(user: UserDto, onLogout: () -> Unit, onOpenStudentServices: (() -> Unit)? = null, onUserUpdated: (UserDto) -> Unit = {}, viewModel: ProfileViewModel = hiltViewModel()) {
    val form by viewModel.form.collectAsState(); var email by remember(user.email) { mutableStateOf(user.email) }; var oldPassword by remember { mutableStateOf("") }; var newPassword by remember { mutableStateOf("") }; var confirmation by remember { mutableStateOf("") }
    AdaptiveWidthContainer {
        Column(Modifier.fillMaxSize().padding(24.dp)) {
            Text("Profile", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(12.dp))
            Text("${user.full_name}\n${user.email}\n${user.username}\nRole: ${user.role}")
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, isError = form.emailError != null, supportingText = { Text(form.emailError.orEmpty()) })
            Button(onClick = { viewModel.updateEmail(email, onUserUpdated) }, enabled = !form.saving) { Text("Update profile") }
            Spacer(Modifier.height(24.dp))
            Text("Version ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(20.dp))
            if (onOpenStudentServices != null) {
                OutlinedButton(onClick = onOpenStudentServices) { Text("Student services") }
                Spacer(Modifier.height(12.dp))
            }
            Text("Change password", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(oldPassword, { oldPassword = it }, label = { Text("Current password") }, visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation())
            OutlinedTextField(newPassword, { newPassword = it }, label = { Text("New password") }, visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation())
            OutlinedTextField(confirmation, { confirmation = it }, label = { Text("Confirm new password") }, visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation())
            Button(onClick = { viewModel.changePassword(oldPassword, newPassword, confirmation) }, enabled = !form.saving) { Text("Update password") }
            form.passwordError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            form.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            Spacer(Modifier.height(12.dp))
            Button(onClick = onLogout) { Text("Sign out") }
        }
    }
}
