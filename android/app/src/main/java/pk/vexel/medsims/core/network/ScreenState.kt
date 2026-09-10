package pk.vexel.medsims.core.network

/** Render-state wrapper over NetworkResult, shared by every read-only screen. */
sealed interface ScreenState<out T> {
    data object Loading: ScreenState<Nothing>
    data class Content<T>(val value: T): ScreenState<T>
    data class Error(val kind: ErrorKind, val message: String, val code: String? = null): ScreenState<Nothing>
}

fun <T> NetworkResult<T>.toScreenState(): ScreenState<T> = when (this) {
    is NetworkResult.Success -> ScreenState.Content(value)
    is NetworkResult.Failure -> ScreenState.Error(kind, message, code)
}
