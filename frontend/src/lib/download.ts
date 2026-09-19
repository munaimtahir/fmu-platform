import { useCallback, useState } from 'react'
import api from '@/api/axios'
import { apiErrorMessage } from './apiErrors'

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

/** Trigger a browser download for an in-memory blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** Extract `filename` from a Content-Disposition header, if present. */
export function filenameFromContentDisposition(header: string | undefined | null): string | undefined {
  if (!header) return undefined
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1])
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1].trim() : undefined
}

export interface DownloadOptions {
  method?: 'get' | 'post'
  params?: Record<string, unknown>
  /** Request body for `post` downloads. */
  data?: unknown
  /** Used when the server does not send a Content-Disposition filename. */
  filename?: string
}

/**
 * Authenticated file download.  Goes through the shared axios instance so the
 * bearer token, refresh handling and impersonation all apply (a plain `<a href>`
 * to an API URL would be sent without credentials).
 *
 * Error responses arrive as Blobs when `responseType` is `blob`; they are decoded
 * back to JSON so `parseApiError` can read the server message.
 */
export async function downloadFile(url: string, options: DownloadOptions = {}): Promise<string> {
  const { method = 'get', params, data, filename = 'download' } = options
  try {
    const response =
      method === 'post'
        ? await api.post<Blob>(url, data, { params, responseType: 'blob' })
        : await api.get<Blob>(url, { params, responseType: 'blob' })
    const name = filenameFromContentDisposition(response.headers['content-disposition']) ?? filename
    saveBlob(response.data, name)
    return name
  } catch (error) {
    const body = (error as { response?: { data?: unknown } }).response?.data
    if (body instanceof Blob) {
      try {
        ;(error as { response: { data: unknown } }).response.data = JSON.parse(await readBlobText(body))
      } catch {
        ;(error as { response: { data: unknown } }).response.data = undefined
      }
    }
    throw error
  }
}

/** React wrapper around `downloadFile` with busy and error state. */
export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async (url: string, options?: DownloadOptions) => {
    setIsDownloading(true)
    setError(null)
    try {
      return await downloadFile(url, options)
    } catch (err) {
      setError(apiErrorMessage(err, 'The download failed. Please try again.'))
      return undefined
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { download, isDownloading, error, clearError: () => setError(null) }
}
