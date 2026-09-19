import api from '@/api/axios'
import type { Paginated } from '@/lib/pagination'

export type NotificationStatus = 'DRAFT' | 'QUEUED' | 'SENT' | 'FAILED'
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type AudienceType = 'ALL_STUDENTS' | 'STUDENT' | 'SECTION' | 'BATCH' | 'PROGRAM' | 'GROUP'

export const NOTIFICATION_STATUSES: NotificationStatus[] = ['DRAFT', 'QUEUED', 'SENT', 'FAILED']
export const NOTIFICATION_PRIORITIES: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

export const AUDIENCE_TYPES: Array<{ value: AudienceType; label: string; targetField?: AudienceTargetField }> = [
  { value: 'ALL_STUDENTS', label: 'All students' },
  { value: 'PROGRAM', label: 'Program', targetField: 'program' },
  { value: 'BATCH', label: 'Batch', targetField: 'batch' },
  { value: 'GROUP', label: 'Group', targetField: 'group' },
  { value: 'SECTION', label: 'Section', targetField: 'section' },
  { value: 'STUDENT', label: 'Single student', targetField: 'student' },
]

export type AudienceTargetField = 'student' | 'section' | 'batch' | 'program' | 'group'

export interface NotificationAudience {
  id: number
  audience_type: AudienceType
  student: number | null
  section: number | null
  batch: number | null
  program: number | null
  group: number | null
  filters_json: unknown
}

export interface AdminNotification {
  id: number
  title: string
  body: string
  category: string
  priority: NotificationPriority
  created_by: number
  created_by_name: string
  send_email: boolean
  publish_at: string | null
  expires_at: string | null
  status: NotificationStatus
  created_at: string
  audiences: NotificationAudience[]
}

export interface AudiencePayload {
  audience_type: AudienceType
  student?: number
  section?: number
  batch?: number
  program?: number
  group?: number
}

export interface CreateNotificationPayload {
  title: string
  body: string
  category: string
  priority: NotificationPriority
  send_email: boolean
  publish_at?: string
  expires_at?: string
  audiences: AudiencePayload[]
  send_now: boolean
}

export interface NotificationListParams {
  page?: number
  status?: NotificationStatus | ''
  category?: string
  ordering?: string
}

export interface LookupOption {
  id: number
  label: string
}

/** Form-level state for composing a notification (strings, as held by inputs). */
export interface AudienceRow {
  key: number
  type: AudienceType
  targetId: string
}

export interface ComposeForm {
  title: string
  body: string
  category: string
  priority: NotificationPriority
  sendEmail: boolean
  /** `datetime-local` value, empty for "publish immediately". */
  publishAt: string
  expiresAt: string
  audiences: AudienceRow[]
}

export function emptyComposeForm(): ComposeForm {
  return {
    title: '',
    body: '',
    category: 'General',
    priority: 'NORMAL',
    sendEmail: false,
    publishAt: '',
    expiresAt: '',
    audiences: [{ key: 1, type: 'ALL_STUDENTS', targetId: '' }],
  }
}

export function targetFieldFor(type: AudienceType): AudienceTargetField | undefined {
  return AUDIENCE_TYPES.find((entry) => entry.value === type)?.targetField
}

/** Client-side checks that mirror the backend serializers so users get instant feedback. */
export function validateComposeForm(form: ComposeForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Title is required.'
  else if (form.title.length > 255) errors.title = 'Title must be at most 255 characters.'
  if (!form.body.trim()) errors.body = 'Message is required.'
  if (!form.category.trim()) errors.category = 'Category is required.'
  else if (form.category.length > 64) errors.category = 'Category must be at most 64 characters.'

  if (form.audiences.length === 0) {
    errors.audiences = 'Add at least one audience.'
  } else if (form.audiences.some((row) => targetFieldFor(row.type) && !row.targetId)) {
    errors.audiences = 'Choose a target for every audience.'
  }

  if (form.publishAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.publishAt)) {
    errors.expiresAt = 'Expiry must be after the publish time.'
  }
  return errors
}

const toIso = (value: string) => new Date(value).toISOString()

export function buildCreatePayload(form: ComposeForm, sendNow: boolean): CreateNotificationPayload {
  const audiences: AudiencePayload[] = form.audiences.map((row) => {
    const field = targetFieldFor(row.type)
    return field ? { audience_type: row.type, [field]: Number(row.targetId) } : { audience_type: row.type }
  })
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    category: form.category.trim(),
    priority: form.priority,
    send_email: form.sendEmail,
    ...(form.publishAt ? { publish_at: toIso(form.publishAt) } : {}),
    ...(form.expiresAt ? { expires_at: toIso(form.expiresAt) } : {}),
    audiences,
    send_now: sendNow,
  }
}

export function audienceSummary(audiences: NotificationAudience[]): string {
  if (audiences.length === 0) return 'No audience'
  return audiences
    .map((audience) => {
      const field = targetFieldFor(audience.audience_type)
      const label = AUDIENCE_TYPES.find((entry) => entry.value === audience.audience_type)?.label ?? audience.audience_type
      return field && audience[field] ? `${label} #${audience[field]}` : label
    })
    .join(', ')
}

export const notificationsAdminService = {
  async list(params?: NotificationListParams): Promise<Paginated<AdminNotification>> {
    const response = await api.get<Paginated<AdminNotification>>('/api/notifications/', {
      params: {
        page: params?.page,
        status: params?.status || undefined,
        category: params?.category || undefined,
        ordering: params?.ordering,
      },
    })
    return response.data
  },

  async get(id: number): Promise<AdminNotification> {
    const response = await api.get<AdminNotification>(`/api/notifications/${id}/`)
    return response.data
  },

  /** Create a draft, or with `send_now` create and queue delivery in one step. */
  async create(payload: CreateNotificationPayload): Promise<AdminNotification> {
    const response = await api.post<AdminNotification>('/api/notifications/', payload)
    return response.data
  },

  /** Queue an existing draft (or failed) notification for delivery. */
  async send(id: number): Promise<AdminNotification> {
    const response = await api.post<AdminNotification>(`/api/notifications/${id}/send/`)
    return response.data
  },

  async lookupPrograms(search?: string): Promise<LookupOption[]> {
    const response = await api.get<Paginated<{ id: number; name: string }>>('/api/academics/programs/', {
      params: { search: search || undefined },
    })
    return response.data.results.map((item) => ({ id: item.id, label: item.name }))
  },

  async lookupBatches(search?: string): Promise<LookupOption[]> {
    const response = await api.get<Paginated<{ id: number; name: string; program_name?: string }>>(
      '/api/academics/batches/',
      { params: { search: search || undefined } }
    )
    return response.data.results.map((item) => ({
      id: item.id,
      label: item.program_name ? `${item.name} (${item.program_name})` : item.name,
    }))
  },

  async lookupGroups(search?: string): Promise<LookupOption[]> {
    const response = await api.get<Paginated<{ id: number; name: string; batch_name?: string }>>(
      '/api/academics/groups/',
      { params: { search: search || undefined } }
    )
    return response.data.results.map((item) => ({
      id: item.id,
      label: item.batch_name ? `${item.name} - ${item.batch_name}` : item.name,
    }))
  },

  async lookupSections(search?: string): Promise<LookupOption[]> {
    const response = await api.get<
      Paginated<{ id: number; name: string; course_code?: string; academic_period_name?: string }>
    >('/api/academics/sections/', { params: { search: search || undefined } })
    return response.data.results.map((item) => ({
      id: item.id,
      label: [item.course_code, item.name, item.academic_period_name && `(${item.academic_period_name})`]
        .filter(Boolean)
        .join(' '),
    }))
  },

  async lookupStudents(search?: string): Promise<LookupOption[]> {
    const response = await api.get<Paginated<{ id: number; reg_no: string; name: string }>>('/api/students/', {
      params: { search: search || undefined },
    })
    return response.data.results.map((item) => ({ id: item.id, label: `${item.reg_no} - ${item.name}` }))
  },

  lookupFor(field: AudienceTargetField, search?: string): Promise<LookupOption[]> {
    switch (field) {
      case 'program':
        return notificationsAdminService.lookupPrograms(search)
      case 'batch':
        return notificationsAdminService.lookupBatches(search)
      case 'group':
        return notificationsAdminService.lookupGroups(search)
      case 'section':
        return notificationsAdminService.lookupSections(search)
      case 'student':
        return notificationsAdminService.lookupStudents(search)
    }
  },
}
