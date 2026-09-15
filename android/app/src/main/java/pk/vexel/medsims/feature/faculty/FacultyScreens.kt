package pk.vexel.medsims.feature.faculty

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer

@Composable fun FacultyHomeScreen(viewModel: FacultyHomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }
    AdaptiveWidthContainer {
        when {
            state.loading -> Box(Modifier.fillMaxSize()) { CircularProgressIndicator(Modifier.padding(24.dp)) }
            state.error != null -> Column(Modifier.padding(24.dp)) { Text(state.error!!, color = MaterialTheme.colorScheme.error); Button(viewModel::load) { Text("Retry") } }
            else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item { Text("Faculty dashboard", style = MaterialTheme.typography.headlineSmall) }
                val stats = state.stats!!
                item { StatCard("My sessions", stats.my_sessions.toString()) }
                item { StatCard("My students", stats.my_students.toString()) }
                item { StatCard("Draft results", stats.draft_results.toString()) }
            }
        }
    }
}

@Composable private fun StatCard(label: String, value: String) = Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(label); Text(value, style = MaterialTheme.typography.headlineMedium) } }

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun FacultyAttendanceScreen(viewModel: FacultyAttendanceViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    var expanded by remember { mutableStateOf(false) }
    var confirm by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { viewModel.loadSessions() }
    AdaptiveWidthContainer {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item { Text("Live attendance", style = MaterialTheme.typography.headlineSmall) }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error); Button(viewModel::loadSessions) { Text("Retry") } } }
            state.message?.let { item { Text(it, color = MaterialTheme.colorScheme.primary) } }
            if (state.sessions.isEmpty() && !state.loading) item { Text("No sessions are assigned to you.") }
            if (state.sessions.isNotEmpty()) item {
                ExposedDropdownMenuBox(expanded, { expanded = it }) {
                    val selected = state.sessions.firstOrNull { it.id == state.selectedSessionId }
                    OutlinedTextField(
                        value = selected?.let { "${it.group_name ?: "Group ${it.group}"} — ${it.starts_at}" }.orEmpty(),
                        onValueChange = {}, readOnly = true, label = { Text("Session") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable).fillMaxWidth(),
                    )
                    ExposedDropdownMenu(expanded, { expanded = false }) { state.sessions.forEach { session -> DropdownMenuItem(text = { Text("${session.group_name ?: "Group ${session.group}"} — ${session.starts_at}") }, onClick = { expanded = false; viewModel.selectSession(session.id) }) } }
                }
            }
            if (state.sessionNextPage != null) item { OutlinedButton(viewModel::loadMoreSessions) { Text("Load more sessions") } }
            if (state.loading) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            state.roster?.let { roster ->
                item { Text("Date: ${roster.date}"); OutlinedTextField(state.search, viewModel::search, label = { Text("Search students") }, modifier = Modifier.fillMaxWidth()) }
                item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedButton({ viewModel.markAll("P") }) { Text("Mark all present") }; OutlinedButton({ viewModel.markAll("A") }) { Text("Mark all absent") } } }
                val filtered = roster.students.filter { state.search.isBlank() || it.name.contains(state.search, true) || it.reg_no.contains(state.search, true) }
                items(filtered, key = { it.student_id }) { student ->
                    val absent = state.statuses[student.student_id] == "A"
                    Card(onClick = { viewModel.toggle(student.student_id) }, modifier = Modifier.fillMaxWidth()) { Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Column { Text(student.name, style = MaterialTheme.typography.titleMedium); Text(student.reg_no) }; Text(if (absent) "Absent" else "Present", color = if (absent) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary) } }
                }
                item { Button({ confirm = true }, enabled = !state.submitting && roster.students.isNotEmpty(), modifier = Modifier.fillMaxWidth()) { Text(if (state.submitting) "Saving…" else "Submit attendance") } }
            }
        }
    }
    if (confirm) {
        val total = state.roster?.students?.size ?: 0
        val absent = state.statuses.values.count { it == "A" }
        AlertDialog(onDismissRequest = { confirm = false }, title = { Text("Confirm attendance") }, text = { Text("Submit $total students: ${total - absent} present and $absent absent?") }, confirmButton = { TextButton({ confirm = false; viewModel.submit() }) { Text("Submit") } }, dismissButton = { TextButton({ confirm = false }) { Text("Cancel") } })
    }
}
