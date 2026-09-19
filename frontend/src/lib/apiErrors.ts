import axios from 'axios'

export interface ApiErrorInfo {
  /** HTTP status, when the server responded. */
  status?: number
  /** Machine-readable code from `{ error: { code } }` bodies. */
  code?: string
  /** A message safe to show to the user. */
  message: string
  /** Per-field messages from DRF validation errors, keyed by field name. */
  fieldErrors: Record<string, string>
  /** True when no response was received (offline, DNS, CORS, timeout). */
  isNetworkError: boolean
}

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.'
const NON_FIELD_KEYS = new Set(['non_field_errors', 'detail', 'error', 'message'])

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was not valid. Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'That item could not be found. It may have been removed.',
  409: 'This conflicts with the current state of the data. Refresh and try again.',
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined
  if (Array.isArray(value)) {
    const parts = value.map(toText).filter((part): part is string => !!part)
    return parts.length ? parts.join(' ') : undefined
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Normalise any thrown value into a displayable error.  Understands the shapes
 * this backend returns: `{ error: { code, message } }`, `{ error: "text" }`,
 * `{ detail }`, `{ message }`, DRF field-error maps, and plain strings.
 */
export function parseApiError(error: unknown, fallback: string = DEFAULT_MESSAGE): ApiErrorInfo {
  const info: ApiErrorInfo = { message: '', fieldErrors: {}, isNetworkError: false }

  if (axios.isAxiosError(error)) {
    info.status = error.response?.status
    info.isNetworkError = !error.response
    const data: unknown = error.response?.data

    if (typeof data === 'string') {
      // HTML error pages from proxies are not useful to show verbatim.
      info.message = data.trim().startsWith('<') ? '' : data.trim()
    } else if (isRecord(data)) {
      const nested = data.error
      if (isRecord(nested)) {
        info.code = typeof nested.code === 'string' ? nested.code : undefined
        info.message = toText(nested.message) ?? ''
      } else {
        info.message = toText(nested) ?? ''
      }
      info.message = info.message || toText(data.detail) || toText(data.message) || toText(data.non_field_errors) || ''

      for (const [key, value] of Object.entries(data)) {
        if (NON_FIELD_KEYS.has(key)) continue
        const text = toText(value)
        if (text) info.fieldErrors[key] = text
      }
      if (!info.message) {
        const [firstKey] = Object.keys(info.fieldErrors)
        if (firstKey) info.message = `${firstKey.replace(/_/g, ' ')}: ${info.fieldErrors[firstKey]}`
      }
    } else if (Array.isArray(data)) {
      info.message = toText(data) ?? ''
    }

    if (!info.message) {
      if (info.isNetworkError) {
        info.message = 'Could not reach the server. Check your connection and try again.'
      } else if (info.status && info.status >= 500) {
        info.message = 'The server ran into a problem. Please try again shortly.'
      } else {
        info.message = (info.status && STATUS_MESSAGES[info.status]) || fallback
      }
    }
    return info
  }

  if (error instanceof Error && error.message) {
    info.message = error.message
    return info
  }
  if (typeof error === 'string' && error.trim()) {
    info.message = error.trim()
    return info
  }
  info.message = fallback
  return info
}

/** Convenience for toasts and inline alerts that only need the text. */
export function apiErrorMessage(error: unknown, fallback?: string): string {
  return parseApiError(error, fallback).message
}
