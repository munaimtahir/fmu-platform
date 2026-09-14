package pk.vexel.medsims.core.student

import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

/** Online-only student mutations. No request is queued or replayed when connectivity is absent. */
@Singleton class StudentRepository @Inject constructor(private val api: StudentApi, private val refresher: TokenRefresher, private val expiry: SessionExpiryNotifier) {
    suspend fun notifications(page: Int? = null) = call { api.notifications(page) }
    suspend fun markNotificationRead(id: Long) = call { api.markNotificationRead(id) }
    suspend fun markAllNotificationsRead() = call { api.markAllNotificationsRead() }
    suspend fun unreadCount() = call { api.unreadCount() }
    suspend fun learningFeed() = call { api.learningFeed() }
    suspend fun compliance(page: Int? = null) = call { api.compliance(page) }
    suspend fun submitCompliance(id: Long, value: String) = call { api.submitCompliance(id, mapOf("value" to value)) }
    suspend fun finance(studentId: Long) = call { api.finance(studentId) }
    private suspend fun <T> call(request: suspend () -> Response<T>): NetworkResult<T> {
        val initial = safeCall(request)
        if (initial !is NetworkResult.Failure || initial.kind != ErrorKind.UNAUTHORIZED) return initial
        return when (refresher.refresh()) { is NetworkResult.Success -> safeCall(request); is NetworkResult.Failure -> { expiry.notifyExpired(); initial } }
    }
}
