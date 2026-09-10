package pk.vexel.medsims.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pk.vexel.medsims.BuildConfig
import pk.vexel.medsims.core.network.UserDto

@Composable fun ProfileScreen(user: UserDto, onLogout: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        Text("${user.full_name}\n${user.email}\n${user.username}\nRole: ${user.role}")
        Spacer(Modifier.height(24.dp))
        Text("Version ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(20.dp))
        Button(onClick = onLogout) { Text("Sign out") }
    }
}
