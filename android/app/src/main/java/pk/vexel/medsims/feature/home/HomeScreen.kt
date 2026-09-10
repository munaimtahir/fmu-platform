package pk.vexel.medsims.feature.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.network.StudentHomeResponse
import pk.vexel.medsims.core.ui.ErrorState

@Composable fun HomeScreen(onOpenTimetable: () -> Unit, onOpenAttendance: () -> Unit, onOpenResults: () -> Unit, viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    when (val s = state) {
        ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
        is ScreenState.Content -> HomeContent(s.value, onOpenTimetable, onOpenAttendance, onOpenResults)
    }
}

@Composable private fun HomeContent(home: StudentHomeResponse, onOpenTimetable: () -> Unit, onOpenAttendance: () -> Unit, onOpenResults: () -> Unit) {
    LazyColumn(Modifier.fillMaxSize().semantics { contentDescription = "Home content" }, contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text("Welcome, ${home.student.display_name}", style = MaterialTheme.typography.headlineSmall)
            Text(home.student.reg_no, style = MaterialTheme.typography.bodyMedium)
        }
        item {
            Card {
                Column(Modifier.padding(16.dp)) {
                    Text("Academic placement", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("Programme: ${home.academic_placement.programme ?: "—"}")
                    Text("Batch: ${home.academic_placement.batch ?: "—"}")
                    Text("Group: ${home.academic_placement.group ?: "—"}")
                    Text("Status: ${home.academic_placement.status}")
                }
            }
        }
        item {
            Card(onClick = onOpenAttendance) {
                Column(Modifier.padding(16.dp)) {
                    Text("Attendance", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("${home.attendance_summary.percentage}% (${home.attendance_summary.present}/${home.attendance_summary.total})")
                }
            }
        }
        item {
            Card(onClick = onOpenResults) {
                Column(Modifier.padding(16.dp)) {
                    Text("Latest results", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    if (home.latest_results.isEmpty()) Text("No published results yet.")
                    else home.latest_results.take(3).forEach { Text("${it.exam_title}: ${it.final_outcome ?: it.status}") }
                }
            }
        }
        item {
            Card(onClick = onOpenTimetable) {
                Column(Modifier.padding(16.dp)) {
                    Text("Today's schedule", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    if (home.today_schedule.isEmpty()) Text("No classes scheduled today.")
                    else home.today_schedule.forEach { Text("${it.start_time ?: ""}–${it.end_time ?: ""}  ${it.course_code ?: ""} ${it.course_name ?: ""}".trim()) }
                }
            }
        }
    }
}
