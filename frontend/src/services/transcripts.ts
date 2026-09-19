/**
 * Transcripts API service
 */
import api from '@/api/axios'

export interface TranscriptJob {
  student_id: number
  email?: string
}

export interface TranscriptEnqueueResult {
  message: string
  job_id: string
  student_id: number
}

/** Error body when outstanding dues block transcript access (HTTP 403). */
export interface FinanceBlock {
  code: 'FINANCE_BLOCKED'
  message: string
  reasons: string[]
  outstanding?: string | number | null
}

/**
 * Extract the finance block from a failed transcript call, if that is why it failed.
 * Works on axios errors whose body has been decoded (see lib/download.downloadFile).
 */
export function financeBlockFrom(error: unknown): FinanceBlock | null {
  const data = (error as { response?: { data?: unknown } })?.response?.data as
    | { error?: Partial<FinanceBlock>; code?: string }
    | undefined
  // Transcript views nest the body under `error`; the results viewset returns it at the top level.
  const body: Partial<FinanceBlock> | undefined =
    data?.error && typeof data.error === 'object' ? data.error : (data as Partial<FinanceBlock> | undefined)
  if (body && body.code === 'FINANCE_BLOCKED') {
    return {
      code: 'FINANCE_BLOCKED',
      message: body.message ?? 'Transcript blocked due to outstanding dues.',
      reasons: Array.isArray(body.reasons) ? body.reasons : [],
      outstanding: body.outstanding ?? null,
    }
  }
  return null
}

export const transcriptDownloadUrl = (studentId: number) => `/api/transcripts/${studentId}/`

export interface TranscriptVerification {
  valid: boolean
  student_id?: number
  reason: string
}

export const transcriptsService = {
  /**
   * Generate transcript for a student (downloads PDF)
   */
  async generate(studentId: number): Promise<Blob> {
    const response = await api.get(`/api/transcripts/${studentId}/`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Enqueue transcript generation as background job
   */
  async enqueue(data: TranscriptJob): Promise<TranscriptEnqueueResult> {
    const response = await api.post<TranscriptEnqueueResult>('/api/transcripts/enqueue/', data)
    return response.data
  },

  /**
   * Verify transcript token
   */
  async verify(token: string): Promise<TranscriptVerification> {
    const response = await api.get<TranscriptVerification>(`/api/transcripts/verify/${encodeURIComponent(token)}/`)
    return response.data
  },
}
