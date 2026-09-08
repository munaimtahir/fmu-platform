package pk.vexel.medsims.feature.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable fun LoginScreen(onAuthenticated: (pk.vexel.medsims.core.network.UserDto) -> Unit, viewModel: LoginViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(state.user) { state.user?.let(onAuthenticated) }
    Scaffold { padding -> Column(Modifier.fillMaxSize().padding(padding).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Vexel MedSIMS", style = MaterialTheme.typography.headlineMedium); Spacer(Modifier.height(8.dp)); Text("Secure academic management")
        Spacer(Modifier.height(32.dp)); OutlinedTextField(value = state.identifier, onValueChange = viewModel::updateIdentifier, label = { Text("Email or username") }, singleLine = true, modifier = Modifier.fillMaxWidth().semantics { contentDescription = "Identifier" })
        Spacer(Modifier.height(12.dp)); OutlinedTextField(value = state.password, onValueChange = viewModel::updatePassword, label = { Text("Password") }, singleLine = true, visualTransformation = if (state.passwordVisible) VisualTransformation.None else PasswordVisualTransformation(), trailingIcon = { TextButton(onClick = viewModel::togglePassword) { Text(if (state.passwordVisible) "Hide" else "Show") } }, modifier = Modifier.fillMaxWidth().semantics { contentDescription = "Password" })
        state.error?.let { Spacer(Modifier.height(12.dp)); Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.semantics { contentDescription = "Login error" }) }
        Spacer(Modifier.height(20.dp)); Button(onClick = viewModel::login, enabled = !state.loading, modifier = Modifier.fillMaxWidth()) { if (state.loading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp); else Text("Sign in") }
    } }
}
