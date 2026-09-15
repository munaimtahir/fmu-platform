package pk.vexel.medsims.feature.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.network.*
import pk.vexel.medsims.core.student.StudentRepository
import javax.inject.Inject
import pk.vexel.medsims.core.document.CachedDocument
import pk.vexel.medsims.core.document.PickedDocument

data class StudentServicesState(
    val loading: Boolean = true,
    val error: String? = null,
    val notifications: List<NotificationInboxDto> = emptyList(),
    val notificationNextPage: Int? = null,
    val unreadCount: Int = 0,
    val materials: List<LearningMaterialDto> = emptyList(),
    val requirements: List<RequirementDto> = emptyList(),
    val finance: StudentFinanceSummaryDto? = null,
    val actionInProgress: Boolean = false,
    val actionMessage: String? = null,
    val readyDocument: CachedDocument? = null,
)
@HiltViewModel class StudentServicesViewModel @Inject constructor(private val repository: StudentRepository): ViewModel() {
    private val _state = MutableStateFlow(StudentServicesState()); val state = _state.asStateFlow()
    fun load(studentId: Long) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val notifications = repository.notifications(); val unread = repository.unreadCount(); val materials = repository.learningFeed(); val requirements = repository.compliance(); val finance = repository.finance(studentId)
        val error = listOf(notifications, unread, materials, requirements, finance).filterIsInstance<NetworkResult.Failure>().firstOrNull()
        _state.value = StudentServicesState(false, error?.message,
            (notifications as? NetworkResult.Success)?.value?.results.orEmpty(), nextPage((notifications as? NetworkResult.Success)?.value?.next), (unread as? NetworkResult.Success)?.value?.count ?: 0, (materials as? NetworkResult.Success)?.value.orEmpty(),
            (requirements as? NetworkResult.Success)?.value?.results.orEmpty(), (finance as? NetworkResult.Success)?.value)
    }
    fun markRead(id: Long, studentId: Long) = viewModelScope.launch { if (repository.markNotificationRead(id) is NetworkResult.Success) load(studentId) }
    fun markAllRead(studentId: Long) = viewModelScope.launch { if (repository.markAllNotificationsRead() is NetworkResult.Success) load(studentId) }
    fun loadMoreNotifications() = viewModelScope.launch {
        val page = _state.value.notificationNextPage ?: return@launch
        when (val result = repository.notifications(page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                notifications = (_state.value.notifications + result.value.results).distinctBy { it.id },
                notificationNextPage = nextPage(result.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = result.message)
        }
    }
    fun submit(id: Long, value: String, document: PickedDocument?, studentId: Long) = viewModelScope.launch {
        if (value.isBlank() && document == null) return@launch
        _state.value = _state.value.copy(actionInProgress = true, actionMessage = null)
        when (val result = repository.submitCompliance(id, value, document)) {
            is NetworkResult.Success -> { load(studentId); _state.value = _state.value.copy(actionMessage = "Compliance submission sent.") }
            is NetworkResult.Failure -> _state.value = _state.value.copy(actionInProgress = false, actionMessage = result.message)
        }
    }
    fun downloadStatement(studentId: Long) = download { repository.statementPdf(studentId) }
    fun downloadFile(url: String, displayName: String) = download { repository.document(url, displayName) }
    fun documentConsumed() { _state.value = _state.value.copy(readyDocument = null) }
    fun viewerUnavailable() { _state.value = _state.value.copy(readyDocument = null, actionMessage = "No app is installed that can open this document.") }

    private fun download(request: suspend () -> NetworkResult<CachedDocument>) = viewModelScope.launch {
        _state.value = _state.value.copy(actionInProgress = true, actionMessage = null)
        when (val result = request()) {
            is NetworkResult.Success -> _state.value = _state.value.copy(actionInProgress = false, readyDocument = result.value)
            is NetworkResult.Failure -> _state.value = _state.value.copy(actionInProgress = false, actionMessage = result.message)
        }
    }

    private fun nextPage(next: String?): Int? = next?.substringAfter("page=", "")?.substringBefore('&')?.toIntOrNull()
}
