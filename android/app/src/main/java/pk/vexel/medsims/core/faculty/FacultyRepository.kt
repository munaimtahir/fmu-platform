package pk.vexel.medsims.core.faculty

import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

interface FacultyDataSource {
    suspend fun dashboard(): NetworkResult<FacultyDashboardDto>
    suspend fun sessions(page: Int? = null): NetworkResult<PaginatedResponse<FacultySessionDto>>
    suspend fun roster(sessionId: Long): NetworkResult<LiveRosterDto>
    suspend fun submit(request: LiveAttendanceRequest): NetworkResult<LiveAttendanceResultDto>
}

/** Faculty writes are sent immediately; failed attendance is never queued or replayed. */
@Singleton class FacultyRepository @Inject constructor(
    private val api: FacultyApi,
    private val refresher: TokenRefresher,
    private val expiry: SessionExpiryNotifier,
): FacultyDataSource {
    override suspend fun dashboard() = call { api.dashboard() }
    override suspend fun sessions(page: Int?) = call { api.sessions(page = page) }
    override suspend fun roster(sessionId: Long) = call { api.roster(sessionId) }
    override suspend fun submit(request: LiveAttendanceRequest) = call { api.submitAttendance(request) }

    private suspend fun <T> call(request: suspend () -> Response<T>): NetworkResult<T> {
        val initial = safeCall(request)
        if (initial !is NetworkResult.Failure || initial.kind != ErrorKind.UNAUTHORIZED) return initial
        return when (refresher.refresh()) {
            is NetworkResult.Success -> safeCall(request)
            is NetworkResult.Failure -> { expiry.notifyExpired(); initial }
        }
    }
}
