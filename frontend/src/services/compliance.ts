/**
 * Compliance API service.
 *
 * Students: /api/compliance/my-compliance/ (own requirements only).
 * Admin/Registrar: /api/compliance/admin-compliance/ and /api/compliance/definitions/.
 * Tasks: compliance.requirements.view|assign|review, compliance.definitions.*
 */
import api from '@/api/axios'
import { allPages } from '@/lib/allPages'
import { postMultipart } from '@/lib/multipart'
import { resultsOf, type Paginated } from '@/lib/pagination'

export type RequirementStatus = 'pending' | 'submitted' | 'verified' | 'rejected'
export type RequirementType = 'document' | 'profile_field'

export const REQUIREMENT_STATUS_OPTIONS: Array<{ value: RequirementStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]
export const REQUIREMENT_TYPE_OPTIONS: Array<{ value: RequirementType; label: string }> = [
  { value: 'document', label: 'Document' },
  { value: 'profile_field', label: 'Profile field' },
]

export interface RequirementSubmission {
  id: number
  has_file: boolean
  file_name: string
  value: string
  submitted_by: number | null
  submitted_by_name: string | null
  created_at: string
}

export interface RequirementInstance {
  id: number
  student: number
  definition: number
  definition_title: string
  definition_description: string
  definition_type: RequirementType
  status: RequirementStatus
  due_at: string | null
  completed_at: string | null
  notes: string
  is_locked: boolean
  is_active: boolean
  assignment_source: 'onboarding_scope' | 'manual'
  submissions: RequirementSubmission[]
  updated_at: string
}

export interface RequirementDefinition {
  id: number
  title: string
  description: string
  requirement_type: RequirementType
  is_mid_session: boolean
  is_active: boolean
  is_onboarding_required: boolean
  created_at?: string
  updated_at?: string
}

export type RequirementDefinitionPayload = Pick<
  RequirementDefinition,
  'title' | 'description' | 'requirement_type' | 'is_mid_session' | 'is_active' | 'is_onboarding_required'
>

export type RequirementScopeType = 'global' | 'program' | 'batch'
export interface RequirementScope {
  id: number
  definition: number
  scope_type: RequirementScopeType
  program: number | null
  batch: number | null
  is_active: boolean
}
export type RequirementScopePayload = Omit<RequirementScope, 'id'>

const MINE = '/api/compliance/my-compliance'
const ADMIN = '/api/compliance/admin-compliance'
const DEFINITIONS = '/api/compliance/definitions'
const SCOPES = '/api/compliance/requirement-scopes'

export const complianceService = {
  // --- Student self-service
  async listMine(): Promise<RequirementInstance[]> {
    const response = await api.get<Paginated<RequirementInstance> | RequirementInstance[]>(`${MINE}/`)
    return resultsOf(response.data)
  },

  async getMine(id: number): Promise<RequirementInstance> {
    const response = await api.get<RequirementInstance>(`${MINE}/${id}/`)
    return response.data
  },

  /** Submit text and/or a file; the backend requires at least one. */
  async submit(id: number, submission: { value?: string; file?: File | null }): Promise<RequirementInstance> {
    return postMultipart<RequirementInstance>(`${MINE}/${id}/submit/`, {
      value: submission.value?.trim() || undefined,
      file: submission.file ?? undefined,
    })
  },

  studentSubmissionDownloadPath(requirementId: number, submissionId: number): string {
    return `${MINE}/${requirementId}/submissions/${submissionId}/download/`
  },

  adminSubmissionDownloadPath(requirementId: number, submissionId: number): string {
    return `${ADMIN}/${requirementId}/submissions/${submissionId}/download/`
  },

  // --- Admin / Registrar review
  async listRequirements(params?: {
    status?: RequirementStatus
    student_id?: number
    page?: number
  }): Promise<Paginated<RequirementInstance>> {
    const response = await api.get<Paginated<RequirementInstance> | RequirementInstance[]>(`${ADMIN}/`, { params })
    const data = response.data
    return Array.isArray(data) ? { count: data.length, next: null, previous: null, results: data } : data
  },

  /** Submitted requirements awaiting review (not paginated by the backend). */
  async reviewQueue(): Promise<RequirementInstance[]> {
    const response = await api.get<RequirementInstance[]>(`${ADMIN}/review_queue/`)
    return resultsOf(response.data)
  },

  async verify(id: number, notes: string): Promise<RequirementInstance> {
    const response = await api.post<RequirementInstance>(`${ADMIN}/${id}/verify/`, { notes })
    return response.data
  },

  async reject(id: number, notes: string): Promise<RequirementInstance> {
    const response = await api.post<RequirementInstance>(`${ADMIN}/${id}/reject/`, { notes })
    return response.data
  },

  async assignToStudent(payload: {
    student_id: number
    definition_id: number
    due_at?: string | null
  }): Promise<RequirementInstance> {
    const body: Record<string, unknown> = { student_id: payload.student_id, definition_id: payload.definition_id }
    if (payload.due_at) body.due_at = payload.due_at
    const response = await api.post<RequirementInstance>(`${ADMIN}/assign_to_student/`, body)
    return response.data
  },

  // --- Definitions
  async listDefinitions(params?: { page?: number }): Promise<Paginated<RequirementDefinition>> {
    const response = await api.get<Paginated<RequirementDefinition> | RequirementDefinition[]>(`${DEFINITIONS}/`, {
      params,
    })
    const data = response.data
    return Array.isArray(data) ? { count: data.length, next: null, previous: null, results: data } : data
  },

  async createDefinition(payload: RequirementDefinitionPayload): Promise<RequirementDefinition> {
    const response = await api.post<RequirementDefinition>(`${DEFINITIONS}/`, payload)
    return response.data
  },

  async updateDefinition(id: number, payload: Partial<RequirementDefinitionPayload>): Promise<RequirementDefinition> {
    const response = await api.patch<RequirementDefinition>(`${DEFINITIONS}/${id}/`, payload)
    return response.data
  },

  async deleteDefinition(id: number): Promise<void> {
    await api.delete(`${DEFINITIONS}/${id}/`)
  },

  async listScopes(): Promise<RequirementScope[]> {
    return allPages<RequirementScope>(`${SCOPES}/`)
  },
  async createScope(payload: RequirementScopePayload): Promise<RequirementScope> {
    const response = await api.post<RequirementScope>(`${SCOPES}/`, payload)
    return response.data
  },
  async updateScope(id: number, payload: Partial<RequirementScopePayload>): Promise<RequirementScope> {
    const response = await api.patch<RequirementScope>(`${SCOPES}/${id}/`, payload)
    return response.data
  },
  async archiveScope(id: number): Promise<void> {
    await api.delete(`${SCOPES}/${id}/`)
  },
}

/** The requirement is open to submission unless verified or locked by the backend rule. */
export function canSubmitRequirement(requirement: Pick<RequirementInstance, 'status' | 'is_locked'>): boolean {
  return requirement.status !== 'verified' && !requirement.is_locked
}
