/**
 * Reduce a stored media URL to a same-origin path so the authenticated client is only ever
 * pointed at our own backend (the bearer token must never be sent to a third-party host).
 * Returns null when the URL is empty or points at an origin that is not allowed.
 */
export function sameOriginPath(fileUrl: string | null | undefined, extraOrigins: string[] = []): string | null {
  if (!fileUrl) return null
  try {
    const parsed = new URL(fileUrl, window.location.origin)
    const allowed = new Set([window.location.origin, ...extraOrigins])
    return allowed.has(parsed.origin) ? `${parsed.pathname}${parsed.search}` : null
  } catch {
    return null
  }
}

/** Last path segment of a media URL, for use as a download filename. */
export function fileNameFromUrl(fileUrl: string | null | undefined, fallback = 'download'): string {
  if (!fileUrl) return fallback
  try {
    const name = decodeURIComponent(new URL(fileUrl, window.location.origin).pathname.split('/').pop() ?? '')
    return name || fallback
  } catch {
    return fallback
  }
}
