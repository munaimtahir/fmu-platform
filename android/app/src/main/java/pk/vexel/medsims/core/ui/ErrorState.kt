package pk.vexel.medsims.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.ScreenState

@Composable fun ErrorState(error: ScreenState.Error, onRetry: () -> Unit) {
    val notAStudent = error.kind == ErrorKind.NOT_FOUND && error.code == "NOT_A_STUDENT"
    val (description, title) = when {
        notAStudent -> "Not a student state" to "No student record is linked to this account."
        error.kind == ErrorKind.OFFLINE -> "Offline state" to "You're offline. Check your connection and try again."
        error.kind == ErrorKind.TIMEOUT -> "Timeout state" to "That took too long. Please try again."
        error.kind == ErrorKind.SERVER -> "Server error state" to "MedSIMS is having trouble right now. Please try again shortly."
        else -> "Error state" to error.message.ifBlank { "Something went wrong. Please try again." }
    }
    Column(Modifier.fillMaxSize().padding(24.dp).semantics { contentDescription = description }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(title, style = MaterialTheme.typography.bodyLarge)
        if (!notAStudent) { Spacer(Modifier.height(16.dp)); Button(onClick = onRetry) { Text("Retry") } }
    }
}
