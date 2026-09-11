package pk.vexel.medsims.feature.results

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
import pk.vexel.medsims.core.network.LatestResultDto
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.PagedState
import pk.vexel.medsims.core.network.ResultRecordDto
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer
import pk.vexel.medsims.core.ui.ErrorState

@Composable fun ResultsScreen(viewModel: ResultsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val history by viewModel.history.collectAsState()
    AdaptiveWidthContainer {
        when (val s = state) {
            ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
            is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
            is ScreenState.Content -> ResultsContent(
                latestResults = s.value,
                history = history,
                onLoadMore = { viewModel.loadHistory() },
                onRetryHistory = { viewModel.loadHistory(reset = true) },
            )
        }
    }
}

@Composable private fun ResultsContent(
    latestResults: List<LatestResultDto>,
    history: PagedState<ResultRecordDto>,
    onLoadMore: () -> Unit,
    onRetryHistory: () -> Unit,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(listState, history.items.size, history.endReached) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index to listState.layoutInfo.totalItemsCount }
            .collect { (lastVisible, total) ->
                if (history.items.isNotEmpty() && lastVisible != null && total > 0 && lastVisible >= total - 3) onLoadMore()
            }
    }
    val financeBlocked = (history.error as? NetworkResult.Failure)?.takeIf { it.code == FINANCE_BLOCKED_CODE }

    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize().semantics { contentDescription = "Results content" },
        contentPadding = PaddingValues(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Text("Results", style = MaterialTheme.typography.headlineSmall) }
        if (latestResults.isEmpty()) {
            item { Text("No published results yet.") }
        } else {
            items(latestResults, key = { "latest-${it.exam_id}" }) { result ->
                Card {
                    Column(Modifier.padding(16.dp)) {
                        Text(result.exam_title, style = MaterialTheme.typography.titleMedium)
                        Text("Status: ${result.status}")
                        Text("Outcome: ${result.final_outcome ?: "—"}")
                        Text("Total obtained: ${result.total_obtained ?: "—"}")
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(8.dp))
            Text("History", style = MaterialTheme.typography.titleMedium)
        }

        if (financeBlocked != null) {
            item { FinanceBlockedCard(financeBlocked) }
        } else {
            if (history.items.isEmpty() && !history.isLoading && history.error == null) {
                item { Text("No results history yet.") }
            }
            items(history.items, key = { "history-${it.id}" }) { record -> ResultRecordCard(record) }
            if (history.isLoading || history.isLoadingMore) {
                item { Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) { CircularProgressIndicator() } }
            }
            history.error?.let { failure ->
                item {
                    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp).semantics { contentDescription = "Results history error" }) {
                        Text(failure.message.ifBlank { "Could not load more results history." })
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = onRetryHistory) { Text("Retry") }
                    }
                }
            }
        }
    }
}

@Composable private fun FinanceBlockedCard(failure: NetworkResult.Failure) {
    Card(Modifier.fillMaxWidth().semantics { contentDescription = "Results blocked" }) {
        Column(Modifier.padding(16.dp)) {
            Text("Results are blocked", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))
            Text(failure.message)
            failure.outstanding?.let { Spacer(Modifier.height(8.dp)); Text("Outstanding balance: $it") }
            if (failure.reasons.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                failure.reasons.forEach { reason -> Text("• $reason") }
            }
        }
    }
}

@Composable private fun ResultRecordCard(record: ResultRecordDto) {
    Card {
        Column(Modifier.padding(16.dp)) {
            Text(record.exam_title ?: "Exam #${record.exam}", style = MaterialTheme.typography.titleMedium)
            Text("Status: ${record.status}")
            Text("Outcome: ${record.final_outcome ?: "—"}")
            Text("Total obtained: ${record.total_obtained ?: "—"}")
        }
    }
}
