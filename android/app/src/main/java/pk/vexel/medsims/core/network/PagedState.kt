package pk.vexel.medsims.core.network

/**
 * Render-state for a scroll-paginated list, kept separate from [ScreenState] so a screen can pair
 * a single-shot summary ([ScreenState]) with an accumulating history list ([PagedState]) below it.
 *
 * [error] carries the raw [NetworkResult.Failure] (not [ScreenState.Error]) so callers can read
 * failure-specific fields such as `code`/`reasons`/`outstanding` (e.g. FINANCE_BLOCKED) without a
 * lossy re-wrap.
 */
data class PagedState<T>(
    val items: List<T> = emptyList(),
    val nextPage: Int? = 1,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val endReached: Boolean = false,
    val error: NetworkResult.Failure? = null,
)
