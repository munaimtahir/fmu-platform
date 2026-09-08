package pk.vexel.medsims.feature.shell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import pk.vexel.medsims.BuildConfig
import pk.vexel.medsims.core.auth.SessionState
import pk.vexel.medsims.core.auth.SessionViewModel
import pk.vexel.medsims.core.network.UserDto
import pk.vexel.medsims.feature.auth.LoginScreen

@Composable fun MedSimsApp(viewModel: SessionViewModel = hiltViewModel()) {
    val session by viewModel.state.collectAsState()
    when (val state = session) { SessionState.Initializing -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(); Text("Preparing MedSIMS", Modifier.padding(top = 72.dp)) }
        SessionState.Unauthenticated, SessionState.Expired -> LoginScreen(viewModel::authenticated)
        is SessionState.Authenticated -> Shell(state.user, viewModel::logout) }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun Shell(user: UserDto, logout: () -> Unit) { var screen by remember { mutableStateOf("Home") }; Scaffold(topBar = { TopAppBar(title = { Text("Vexel MedSIMS") }) }, bottomBar = { NavigationBar { listOf("Home", "Profile", "Settings").forEach { destination -> NavigationBarItem(selected = screen == destination, onClick = { screen = destination }, icon = { Text(destination.take(1)) }, label = { Text(destination) }) } } }) { padding -> Column(Modifier.padding(padding).padding(24.dp)) { when (screen) { "Home" -> { Text("Welcome, ${user.full_name}", style = MaterialTheme.typography.headlineSmall); Text(user.role); Spacer(Modifier.height(20.dp)); Card { Text("Your role-aware MedSIMS workspace is ready for feature development.", Modifier.padding(16.dp)) } }; "Profile" -> { Text("Profile", style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.height(12.dp)); Text("${user.full_name}\n${user.email}\n${user.username}\nRole: ${user.role}") }; else -> { Text("Settings", style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.height(12.dp)); Text("Version ${BuildConfig.VERSION_NAME}"); Spacer(Modifier.height(20.dp)); Button(onClick = logout) { Text("Sign out") } } } } } }
