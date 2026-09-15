package pk.vexel.medsims.core.student

import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import pk.vexel.medsims.core.document.CachedDocument
import pk.vexel.medsims.core.document.DocumentStore
import pk.vexel.medsims.core.document.PickedDocument
import java.io.IOException

/** Online-only student mutations. No request is queued or replayed when connectivity is absent. */
@Singleton class StudentRepository @Inject constructor(
    private val api: StudentApi,
    private val refresher: TokenRefresher,
    private val expiry: SessionExpiryNotifier,
    private val documents: DocumentStore,
) {
    suspend fun notifications(page: Int? = null) = call { api.notifications(page) }
    suspend fun markNotificationRead(id: Long) = call { api.markNotificationRead(id) }
    suspend fun markAllNotificationsRead() = call { api.markAllNotificationsRead() }
    suspend fun unreadCount() = call { api.unreadCount() }
    suspend fun learningFeed() = call { api.learningFeed() }
    suspend fun compliance(page: Int? = null) = call { api.compliance(page) }
    suspend fun submitCompliance(id: Long, value: String, document: PickedDocument? = null): NetworkResult<RequirementDto> {
        val filePart = document?.let { MultipartBody.Part.createFormData("file", it.displayName, documents.requestBody(it)) }
        val valuePart = value.takeIf { it.isNotBlank() }?.toRequestBody()
        return call { api.submitCompliance(id, filePart, valuePart) }
    }
    suspend fun finance(studentId: Long) = call { api.finance(studentId) }
    suspend fun statementPdf(studentId: Long): NetworkResult<CachedDocument> = download("fee-statement.pdf") { api.statementPdf(studentId) }
    suspend fun document(url: String, displayName: String): NetworkResult<CachedDocument> = download(displayName) { api.download(url) }

    private suspend fun download(name: String, request: suspend () -> Response<okhttp3.ResponseBody>): NetworkResult<CachedDocument> = when (val result = call(request)) {
        is NetworkResult.Success -> try { NetworkResult.Success(documents.cache(result.value, name)) }
        catch (_: IOException) { NetworkResult.Failure(ErrorKind.UNKNOWN, "The document could not be saved on this device.") }
        is NetworkResult.Failure -> result
    }
    private suspend fun <T> call(request: suspend () -> Response<T>): NetworkResult<T> {
        val initial = safeCall(request)
        if (initial !is NetworkResult.Failure || initial.kind != ErrorKind.UNAUTHORIZED) return initial
        return when (refresher.refresh()) { is NetworkResult.Success -> safeCall(request); is NetworkResult.Failure -> { expiry.notifyExpired(); initial } }
    }
}
