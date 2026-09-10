package pk.vexel.medsims.core.auth

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/** Lets repositories signal an unrecoverable 401 (refresh already retried) without depending on SessionViewModel directly. */
@Singleton
class SessionExpiryNotifier @Inject constructor() {
    private val _expired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val expired = _expired.asSharedFlow()
    fun notifyExpired() { _expired.tryEmit(Unit) }
}
