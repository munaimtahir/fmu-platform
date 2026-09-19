/**
 * Result corrections service.
 *
 * Backend: /api/result-corrections/ (ResultCorrectionRequestViewSet).  Reviewers
 * (results.result_corrections.review) see every request and may review/apply;
 * requesters see their own.  Students may request corrections for their own results.
 * The list endpoint has no server-side status filter, so filtering happens client-side.
 */
import api from '@/api/axios'
import type { Paginated } from '@/lib/pagination'

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED'
export type CorrectionDecision = 'APPROVED' | 'REJECTED'

export const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  APPLIED: 'Applied',
}

export interface ProposedChanges {
  total_obtained?: string
  total_max?: string
  /** Component entry id -> corrected marks. */
  component_marks?: Record<string, string>
}

export interface ResultCorrection {
  id: number
  result_header: number
  result_status: string
  requested_by: number
  requested_by_username?: string
  reason: string
  proposed_changes: ProposedChanges
  original_values: {
    total_obtained?: string
    total_max?: string
    status?: string
    component_marks?: Record<string, string>
  }
  status: CorrectionStatus
  reviewed_by: number | null
  reviewed_by_username?: string
  reviewed_at: string | null
  review_note: string
  applied_by: number | null
  applied_at: string | null
  created_at: string
  updated_at: string
}

export interface CorrectionRequestInput {
  result_header: number
  reason: string
  proposed_changes: ProposedChanges
}

const MAX_PAGES = 20

export const resultCorrectionsService = {
  async list(params?: { page?: number }): Promise<Paginated<ResultCorrection>> {
    const response = await api.get<Paginated<ResultCorrection>>('/api/result-corrections/', { params })
    return response.data
  },

  /** Every correction the caller may see, following pages (volumes are small). */
  async listAll(): Promise<ResultCorrection[]> {
    const all: ResultCorrection[] = []
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await resultCorrectionsService.list({ page })
      all.push(...data.results)
      if (!data.next) break
    }
    return all
  },

  async getById(id: number): Promise<ResultCorrection> {
    const response = await api.get<ResultCorrection>(`/api/result-corrections/${id}/`)
    return response.data
  },

  async create(data: CorrectionRequestInput): Promise<ResultCorrection> {
    const response = await api.post<ResultCorrection>('/api/result-corrections/', data)
    return response.data
  },

  async review(id: number, decision: CorrectionDecision, reviewNote: string): Promise<ResultCorrection> {
    const response = await api.post<ResultCorrection>(`/api/result-corrections/${id}/review/`, {
      decision,
      review_note: reviewNote,
    })
    return response.data
  },

  async apply(id: number): Promise<ResultCorrection> {
    const response = await api.post<ResultCorrection>(`/api/result-corrections/${id}/apply/`)
    return response.data
  },
}
