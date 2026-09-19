import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import api from '@/api/axios'
import {
  audienceSummary,
  buildCreatePayload,
  emptyComposeForm,
  notificationsAdminService,
  validateComposeForm,
  type ComposeForm,
} from './notificationsAdmin'

const validForm = (): ComposeForm => ({
  ...emptyComposeForm(),
  title: '  Exam schedule  ',
  body: 'Papers start Monday.',
  category: 'Exam',
})

describe('validateComposeForm', () => {
  it('accepts a complete form', () => {
    expect(validateComposeForm(validForm())).toEqual({})
  })

  it('requires title, message and category', () => {
    const errors = validateComposeForm({ ...emptyComposeForm(), category: '  ' })
    expect(errors).toMatchObject({ title: expect.any(String), body: expect.any(String), category: expect.any(String) })
  })

  it('needs an audience, and a target for targeted audiences', () => {
    expect(validateComposeForm({ ...validForm(), audiences: [] }).audiences).toMatch(/at least one/i)
    const targeted = { ...validForm(), audiences: [{ key: 1, type: 'PROGRAM' as const, targetId: '' }] }
    expect(validateComposeForm(targeted).audiences).toMatch(/target/i)
    const ok = { ...validForm(), audiences: [{ key: 1, type: 'PROGRAM' as const, targetId: '4' }] }
    expect(validateComposeForm(ok)).toEqual({})
  })

  it('rejects an expiry that is not after the publish time', () => {
    const form = { ...validForm(), publishAt: '2026-10-02T10:00', expiresAt: '2026-10-01T10:00' }
    expect(validateComposeForm(form).expiresAt).toMatch(/after/i)
  })

  it('enforces the backend length limits', () => {
    expect(validateComposeForm({ ...validForm(), title: 'x'.repeat(256) }).title).toMatch(/255/)
    expect(validateComposeForm({ ...validForm(), category: 'x'.repeat(65) }).category).toMatch(/64/)
  })
})

describe('buildCreatePayload', () => {
  it('maps audiences onto the backend target fields and trims text', () => {
    const form: ComposeForm = {
      ...validForm(),
      priority: 'HIGH',
      sendEmail: true,
      audiences: [
        { key: 1, type: 'ALL_STUDENTS', targetId: '' },
        { key: 2, type: 'SECTION', targetId: '12' },
        { key: 3, type: 'STUDENT', targetId: '7' },
      ],
    }
    expect(buildCreatePayload(form, false)).toEqual({
      title: 'Exam schedule',
      body: 'Papers start Monday.',
      category: 'Exam',
      priority: 'HIGH',
      send_email: true,
      audiences: [{ audience_type: 'ALL_STUDENTS' }, { audience_type: 'SECTION', section: 12 }, { audience_type: 'STUDENT', student: 7 }],
      send_now: false,
    })
  })

  it('sends schedule times as ISO strings and only when provided', () => {
    const scheduled = buildCreatePayload({ ...validForm(), publishAt: '2026-10-01T09:30', expiresAt: '2026-10-05T09:30' }, true)
    expect(scheduled.publish_at).toBe(new Date('2026-10-01T09:30').toISOString())
    expect(scheduled.expires_at).toBe(new Date('2026-10-05T09:30').toISOString())
    expect(scheduled.send_now).toBe(true)
    const immediate = buildCreatePayload(validForm(), false)
    expect(immediate).not.toHaveProperty('publish_at')
    expect(immediate).not.toHaveProperty('expires_at')
  })
})

describe('audienceSummary', () => {
  it('describes audiences', () => {
    expect(audienceSummary([])).toBe('No audience')
    expect(
      audienceSummary([
        { id: 1, audience_type: 'ALL_STUDENTS', student: null, section: null, batch: null, program: null, group: null, filters_json: null },
        { id: 2, audience_type: 'BATCH', student: null, section: null, batch: 3, program: null, group: null, filters_json: null },
      ])
    ).toBe('All students, Batch #3')
  })
})

describe('notificationsAdminService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists with filters and drops empty ones', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } })
    await notificationsAdminService.list({ page: 2, status: 'DRAFT', category: '', ordering: '-created_at' })
    expect(api.get).toHaveBeenCalledWith('/api/notifications/', {
      params: { page: 2, status: 'DRAFT', category: undefined, ordering: '-created_at' },
    })
  })

  it('creates and sends through the documented endpoints', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 5 } })
    const payload = buildCreatePayload(validForm(), true)
    await notificationsAdminService.create(payload)
    expect(api.post).toHaveBeenCalledWith('/api/notifications/', payload)
    await notificationsAdminService.send(5)
    expect(api.post).toHaveBeenCalledWith('/api/notifications/5/send/')
  })

  it('reads one notification', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 9 } })
    await notificationsAdminService.get(9)
    expect(api.get).toHaveBeenCalledWith('/api/notifications/9/')
  })

  it('builds readable lookup labels', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [{ id: 3, reg_no: 'R-3', name: 'Ada', course_code: 'ANA', name_: '' }] },
    })
    expect(await notificationsAdminService.lookupStudents('ad')).toEqual([{ id: 3, label: 'R-3 - Ada' }])
    expect(api.get).toHaveBeenCalledWith('/api/students/', { params: { search: 'ad' } })
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [{ id: 8, name: 'A', course_code: 'ANA101', academic_period_name: 'Y1' }] },
    })
    expect(await notificationsAdminService.lookupFor('section')).toEqual([{ id: 8, label: 'ANA101 A (Y1)' }])
  })
})
