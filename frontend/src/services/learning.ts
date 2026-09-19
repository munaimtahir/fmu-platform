/**
 * Learning materials API service.
 *
 * Staff: /api/learning/materials/ (+ nested audiences, publish, archive).
 * Students: /api/learning/student-feed/ (only currently available, published items).
 * Tasks: learning.materials.*, learning.feed.view
 */
import api from '@/api/axios'
import { patchMultipart, postMultipart } from '@/lib/multipart'
import { resultsOf, type Paginated } from '@/lib/pagination'

export type MaterialKind = 'FILE' | 'LINK'
export type MaterialStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface MaterialAudience {
  id: number
  material: number
  program: number | null
  batch: number | null
  term: number | null
  course: number | null
  section: number | null
  created_at: string
}

export interface LearningMaterial {
  id: number
  title: string
  description: string
  kind: MaterialKind
  file: string | null
  url: string | null
  mime_type: string | null
  size_bytes: number | null
  status: MaterialStatus
  published_at: string | null
  available_from: string | null
  available_until: string | null
  created_by: number
  created_at: string
  updated_at: string
  audiences: MaterialAudience[]
}

export interface MaterialPayload {
  title: string
  description?: string
  kind: MaterialKind
  url?: string | null
  file?: File | null
  available_from?: string | null
  available_until?: string | null
}

export type AudienceScope = Partial<Pick<MaterialAudience, 'program' | 'batch' | 'term' | 'course' | 'section'>>

const MATERIALS = '/api/learning/materials'

/** Multipart when a file is attached (or being cleared); JSON otherwise. */
function isMultipart(payload: Partial<MaterialPayload>): boolean {
  return payload.file instanceof Blob
}

type MultipartValues = Parameters<typeof postMultipart>[1]

/** `toFormData` skips null, so send '' (DRF reads it as null for nullable fields) to clear a value. */
function toMultipartValues(payload: Partial<MaterialPayload>): MultipartValues {
  const values: MultipartValues = {}
  for (const [key, value] of Object.entries(toBody(payload))) {
    if (value === undefined) continue
    values[key] = value === null ? '' : (value as string | Blob)
  }
  return values
}

function toBody(payload: Partial<MaterialPayload>) {
  return {
    title: payload.title,
    description: payload.description,
    kind: payload.kind,
    url: payload.url,
    file: payload.file,
    available_from: payload.available_from,
    available_until: payload.available_until,
  }
}

export const learningService = {
  async listMaterials(params?: {
    status?: MaterialStatus
    kind?: MaterialKind
    search?: string
    page?: number
  }): Promise<Paginated<LearningMaterial>> {
    const response = await api.get<Paginated<LearningMaterial>>(`${MATERIALS}/`, { params })
    return response.data
  },

  async getMaterial(id: number): Promise<LearningMaterial> {
    const response = await api.get<LearningMaterial>(`${MATERIALS}/${id}/`)
    return response.data
  },

  async createMaterial(payload: MaterialPayload): Promise<LearningMaterial> {
    if (isMultipart(payload)) {
      return postMultipart<LearningMaterial>(`${MATERIALS}/`, toMultipartValues(payload))
    }
    const response = await api.post<LearningMaterial>(`${MATERIALS}/`, stripUndefined(toBody(payload)))
    return response.data
  },

  async updateMaterial(id: number, payload: Partial<MaterialPayload>): Promise<LearningMaterial> {
    if (isMultipart(payload)) {
      return patchMultipart<LearningMaterial>(`${MATERIALS}/${id}/`, toMultipartValues(payload))
    }
    const response = await api.patch<LearningMaterial>(`${MATERIALS}/${id}/`, stripUndefined(toBody(payload)))
    return response.data
  },

  async deleteMaterial(id: number): Promise<void> {
    await api.delete(`${MATERIALS}/${id}/`)
  },

  async publish(id: number): Promise<LearningMaterial> {
    const response = await api.post<LearningMaterial>(`${MATERIALS}/${id}/publish/`)
    return response.data
  },

  async archive(id: number): Promise<LearningMaterial> {
    const response = await api.post<LearningMaterial>(`${MATERIALS}/${id}/archive/`)
    return response.data
  },

  async listAudiences(materialId: number): Promise<MaterialAudience[]> {
    const response = await api.get<MaterialAudience[] | Paginated<MaterialAudience>>(`${MATERIALS}/${materialId}/audiences/`)
    return resultsOf(response.data)
  },

  async addAudience(materialId: number, scope: AudienceScope): Promise<MaterialAudience[]> {
    const response = await api.post<MaterialAudience[]>(`${MATERIALS}/${materialId}/audiences/`, stripEmpty(scope))
    return response.data
  },

  async removeAudience(audienceId: number): Promise<void> {
    await api.delete(`/api/learning/audiences/${audienceId}/`)
  },

  async getFeed(): Promise<LearningMaterial[]> {
    const response = await api.get<LearningMaterial[] | Paginated<LearningMaterial>>('/api/learning/student-feed/')
    return resultsOf(response.data)
  },
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>
}

function stripEmpty(scope: AudienceScope): AudienceScope {
  return Object.fromEntries(Object.entries(scope).filter(([, v]) => v !== null && v !== undefined)) as AudienceScope
}

/** Only http(s) links may be opened; anything else (javascript:, data:) is rejected. */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export type Availability =
  | { state: 'available'; message: string | null }
  | { state: 'scheduled'; message: string }
  | { state: 'expired'; message: string }

/** Human-readable availability window for a material at `now`. */
export function availabilityOf(
  material: Pick<LearningMaterial, 'available_from' | 'available_until'>,
  now: Date = new Date()
): Availability {
  const from = material.available_from ? new Date(material.available_from) : null
  const until = material.available_until ? new Date(material.available_until) : null
  if (from && from > now) return { state: 'scheduled', message: `Available from ${from.toLocaleString()}` }
  if (until && until < now) return { state: 'expired', message: `Expired on ${until.toLocaleString()}` }
  if (until) return { state: 'available', message: `Available until ${until.toLocaleString()}` }
  return { state: 'available', message: null }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
