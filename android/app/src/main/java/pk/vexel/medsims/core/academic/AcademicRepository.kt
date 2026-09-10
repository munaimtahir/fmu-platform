package pk.vexel.medsims.core.academic

import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.MobileApi
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.network.StudentHomeResponse
import pk.vexel.medsims.core.network.StudentTimetableResponse
import pk.vexel.medsims.core.network.safeCall
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AcademicRepository @Inject constructor(
    private val api: MobileApi,
    private val tokenRefresher: TokenRefresher,
    private val expiryNotifier: SessionExpiryNotifier,
) {
    suspend fun home(): NetworkResult<StudentHomeResponse> = callWithRefresh { api.studentHome() }
    suspend fun timetable(weekStartDate: String? = null): NetworkResult<StudentTimetableResponse> = callWithRefresh { api.studentTimetable(weekStartDate) }

    /** Retries once through TokenRefresher on a 401; if that also fails, the session is unrecoverable. */
    private suspend fun <T> callWithRefresh(request: suspend () -> Response<T>): NetworkResult<T> {
        val result = safeCall(request)
        if (result !is NetworkResult.Failure || result.kind != ErrorKind.UNAUTHORIZED) return result
        return when (tokenRefresher.refresh()) {
            is NetworkResult.Success -> safeCall(request)
            is NetworkResult.Failure -> { expiryNotifier.notifyExpired(); result }
        }
    }
}
