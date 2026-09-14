package pk.vexel.medsims.feature.student

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.platform.LocalUriHandler
import android.net.Uri
import pk.vexel.medsims.core.network.RequirementDto
import pk.vexel.medsims.core.network.UserDto
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer

/** Student-only read models refresh from the server on entry; mutations execute immediately online. */
@Composable fun StudentServicesScreen(user: UserDto, viewModel: StudentServicesViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState(); val studentId = user.student_id
    val uriHandler = LocalUriHandler.current
    var confirmingSubmission by remember { mutableStateOf<RequirementDto?>(null) }
    var confirmingValue by remember { mutableStateOf("") }
    LaunchedEffect(studentId) { if (studentId != null) viewModel.load(studentId) }
    AdaptiveWidthContainer { when {
        studentId == null -> Box(Modifier.fillMaxSize(), Alignment.Center) { Text("Your account is not linked to a student record.") }
        state.loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { Text("Student services", style = MaterialTheme.typography.headlineSmall) }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error); Button(onClick = { viewModel.load(studentId) }) { Text("Retry") } } }
            item { Text("My fees", style = MaterialTheme.typography.titleMedium); state.finance?.let { Card { Column(Modifier.padding(16.dp)) { Text("Outstanding: ${it.outstanding}"); Text("Debits: ${it.total_debits}  Credits: ${it.total_credits}") } } } ?: Text("Fee summary is unavailable.") }
            item { Text("Learning materials", style = MaterialTheme.typography.titleMedium) }
            if (state.materials.isEmpty()) item { Text("No learning materials available.") }
            items(state.materials, key = { it.id }) { material -> Card { Column(Modifier.padding(16.dp)) {
                Text(material.title, style = MaterialTheme.typography.titleMedium); Text(material.description)
                val link = material.url ?: material.file
                if (link != null && isSafeExternalLink(link)) {
                    TextButton(onClick = { uriHandler.openUri(link) }) { Text(if (material.url != null) "Open link" else "Open material") }
                } else Text("No safe link attached")
            } } }
            item { Text("Compliance", style = MaterialTheme.typography.titleMedium) }
            if (state.requirements.isEmpty()) item { Text("No compliance requirements.") }
            items(state.requirements, key = { it.id }) { requirement -> var value by remember(requirement.id) { mutableStateOf("") }; Card { Column(Modifier.padding(16.dp)) {
                Text(requirement.definition_title, style = MaterialTheme.typography.titleMedium); Text(requirement.definition_description); Text("Status: ${requirement.status}")
                requirement.notes?.takeIf { it.isNotBlank() }?.let { Text("Review note: $it") }
                if (requirement.is_locked) Text("This requirement is locked.", color = MaterialTheme.colorScheme.error)
                else if (requirement.status.lowercase() in setOf("pending", "rejected")) {
                    OutlinedTextField(value, { value = it }, label = { Text("Submission details") })
                    Button(onClick = { confirmingSubmission = requirement; confirmingValue = value }, enabled = value.isNotBlank()) { Text(if (requirement.status.lowercase() == "rejected") "Replace submission" else "Submit") }
                }
            } } }
            item { Text("Notifications", style = MaterialTheme.typography.titleMedium) }
            item { Text("${state.unreadCount} unread"); if (state.unreadCount > 0) TextButton(onClick = { viewModel.markAllRead(studentId) }) { Text("Mark all read") } }
            if (state.notifications.isEmpty()) item { Text("No notifications.") }
            items(state.notifications, key = { it.id }) { notice -> Card { Column(Modifier.padding(16.dp)) { Text(notice.notification.title, style = MaterialTheme.typography.titleMedium); Text(notice.notification.body); Text(notice.notification.category); if (notice.read_at == null) TextButton(onClick = { viewModel.markRead(notice.id, studentId) }) { Text("Mark read") } } } }
            if (state.notificationNextPage != null) item { OutlinedButton(onClick = viewModel::loadMoreNotifications) { Text("Load more notifications") } }
        }
    }
    }
    confirmingSubmission?.let { requirement ->
        AlertDialog(
            onDismissRequest = { confirmingSubmission = null },
            title = { Text("Confirm submission") },
            text = { Text("This sends your ${requirement.definition_title} submission to the server immediately. It cannot be queued for later offline.") },
            confirmButton = { TextButton(onClick = { viewModel.submit(requirement.id, confirmingValue, studentId ?: return@TextButton); confirmingSubmission = null }) { Text("Send") } },
            dismissButton = { TextButton(onClick = { confirmingSubmission = null }) { Text("Cancel") } },
        )
    }
}

/** Do not hand off custom schemes, content URIs, or local paths supplied by server content. */
private fun isSafeExternalLink(value: String): Boolean = Uri.parse(value).scheme?.lowercase() in setOf("https", "http")
