package pk.vexel.medsims.feature.attendance

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import pk.vexel.medsims.core.network.AttendanceRecordDto
import pk.vexel.medsims.core.network.AttendanceSummaryDto
import pk.vexel.medsims.core.network.PagedState
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.ui.ErrorState

@Composable fun AttendanceScreen(viewModel: AttendanceViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val history by viewModel.history.collectAsState()
    when (val s = state) {
        ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
        is ScreenState.Content -> AttendanceContent(
            summary = s.value,
            history = history,
            onLoadMore = { viewModel.loadHistory() },
            onRetryHistory = { viewModel.loadHistory(reset = true) },
        )
    }
}

@Composable private fun AttendanceContent(
    summary: AttendanceSummaryDto,
    history: PagedState<AttendanceRecordDto>,
    onLoadMore: () -> Unit,
    onRetryHistory: () -> Unit,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(listState, history.items.size, history.endReached) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index to listState.layoutInfo.totalItemsCount }
            .collect { (lastVisible, total) ->
                if (lastVisible != null && total > 0 && lastVisible >= total - 3) onLoadMore()
            }
    }
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize().semantics { contentDescription = "Attendance content" },
        contentPadding = PaddingValues(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Text("Attendance", style = MaterialTheme.typography.headlineSmall) }
        item {
            if (summary.total == 0) {
                Text("No attendance records yet.")
            } else {
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
        item {
            Spacer(Modifier.height(8.dp))
            Text("History", style = MaterialTheme.typography.titleMedium)
        }
        if (history.items.isEmpty() && !history.isLoading && history.error == null) {
            item { Text("No attendance history yet.") }
        }
        items(history.items, key = { it.id }) { record -> AttendanceRecordCard(record) }
        if (history.isLoading || history.isLoadingMore) {
            item { Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) { CircularProgressIndicator() } }
        }
        history.error?.let { failure ->
            item {
                Column(Modifier.fillMaxWidth().padding(vertical = 8.dp).semantics { contentDescription = "Attendance history error" }) {
                    Text(failure.message.ifBlank { "Could not load more attendance history." })
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = onRetryHistory) { Text("Retry") }
                }
            }
        }
    }
}

@Composable private fun AttendanceRecordCard(record: AttendanceRecordDto) {
    Card {
        Column(Modifier.padding(16.dp)) {
            Text(record.status, style = MaterialTheme.typography.titleMedium)
            record.session_department?.let { Text(it) }
            record.marked_at?.let { Text("Marked: $it") }
        }
    }
}
