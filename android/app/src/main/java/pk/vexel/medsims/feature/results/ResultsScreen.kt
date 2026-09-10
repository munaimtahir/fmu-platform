package pk.vexel.medsims.feature.results

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
import pk.vexel.medsims.core.network.LatestResultDto
import pk.vexel.medsims.core.network.ScreenState
import pk.vexel.medsims.core.ui.ErrorState

@Composable fun ResultsScreen(viewModel: ResultsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    when (val s = state) {
        ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        is ScreenState.Error -> ErrorState(s, onRetry = viewModel::load)
        is ScreenState.Content -> ResultsContent(s.value)
    }
}

@Composable private fun ResultsContent(results: List<LatestResultDto>) {
    if (results.isEmpty()) { Box(Modifier.fillMaxSize().semantics { contentDescription = "Results empty" }, Alignment.Center) { Text("No published results yet.") }; return }
    LazyColumn(Modifier.fillMaxSize().semantics { contentDescription = "Results list" }, contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(results, key = { it.exam_id }) { result ->
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
}
