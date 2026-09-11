package pk.vexel.medsims.feature.timetable

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import pk.vexel.medsims.core.network.ScheduleEntryDto
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer
import pk.vexel.medsims.core.ui.ErrorState
import java.time.LocalDate

@Composable fun TimetableScreen(viewModel: TimetableViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val mode by viewModel.mode.collectAsState()
    AdaptiveWidthContainer {
        Column(Modifier.fillMaxSize()) {
            SegmentedButtonRow(mode, viewModel::setMode)
            when (val s = state) {
                ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
                is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
                is ScreenState.Content -> {
                    val entries = if (mode == TimetableMode.TODAY) s.value.entries.filter { it.date == LocalDate.now().toString() } else s.value.entries
                    TimetableList(entries)
                }
            }
        }
    }
}

@Composable private fun SegmentedButtonRow(mode: TimetableMode, onModeChange: (TimetableMode) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        TimetableMode.entries.forEach { candidate ->
            FilterChip(selected = mode == candidate, onClick = { onModeChange(candidate) }, label = { Text(if (candidate == TimetableMode.TODAY) "Today" else "Week") })
        }
    }
}

@Composable private fun TimetableList(entries: List<ScheduleEntryDto>) {
    if (entries.isEmpty()) { Box(Modifier.fillMaxSize().semantics { contentDescription = "Timetable empty" }, Alignment.Center) { Text("No schedule found.") }; return }
    LazyColumn(Modifier.fillMaxSize().semantics { contentDescription = "Timetable list" }, contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(entries, key = { it.id }) { entry ->
            Card {
                Column(Modifier.padding(16.dp)) {
                    Text("${entry.day_name ?: entry.date}  ${entry.start_time ?: ""}–${entry.end_time ?: ""}", style = MaterialTheme.typography.titleSmall)
                    Text("${entry.course_code ?: ""} ${entry.course_name ?: ""}".trim())
                    Text("${entry.faculty_name ?: "—"} · ${entry.room ?: "—"}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
