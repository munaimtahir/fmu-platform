package pk.vexel.medsims.feature.attendance

import androidx.compose.foundation.layout.*
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
import pk.vexel.medsims.core.network.AttendanceSummaryDto
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.ui.ErrorState

@Composable fun AttendanceScreen(viewModel: AttendanceViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    when (val s = state) {
        ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
        is ScreenState.Content -> AttendanceContent(s.value)
    }
}

@Composable private fun AttendanceContent(summary: AttendanceSummaryDto) {
    Column(Modifier.fillMaxSize().padding(24.dp).semantics { contentDescription = "Attendance content" }) {
        Text("Attendance", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))
        if (summary.total == 0) { Text("No attendance records yet."); return }
        Card {
            Column(Modifier.padding(16.dp)) {
                Text("${summary.percentage}% overall", style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text("Present: ${summary.present}")
                Text("Absent: ${summary.absent}")
                Text("Late: ${summary.late}")
                Text("Leave: ${summary.leave}")
                Text("Total sessions: ${summary.total}")
            }
        }
    }
}
