package pk.vexel.medsims.core.auth

import pk.vexel.medsims.core.network.NetworkResult

/** Narrow seam AcademicRepository depends on, so it can be exercised in a JVM unit test without a real SessionStore/Context. */
interface TokenRefresher {
    suspend fun refresh(): NetworkResult<Unit>
}
