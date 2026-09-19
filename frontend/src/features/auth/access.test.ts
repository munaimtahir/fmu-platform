import { describe, it, expect } from 'vitest'
import {
  ALL_ROLES,
  LANDING_PATHS,
  canAccess,
  hasAnyRole,
  hasAnyTask,
  landingPathFor,
  normalizeRole,
  normalizeRoles,
  type AccessContext,
} from './access'

const ctx = (roles: AccessContext['roles'] = [], tasks: string[] = []): AccessContext => ({ roles, tasks })

describe('normalizeRole', () => {
  it.each([
    ['ADMIN', 'Admin'],
    ['Admin', 'Admin'],
    ['REGISTRAR', 'Registrar'],
    ['EXAMCELL', 'ExamCell'],
    ['ExamCell', 'ExamCell'],
    ['EXAM_CELL', 'ExamCell'],
    ['OFFICE_ASSISTANT', 'OfficeAssistant'],
    ['OfficeAssistant', 'OfficeAssistant'],
    ['coordinator', 'Coordinator'],
  ])('maps %s to %s', (raw, expected) => {
    expect(normalizeRole(raw)).toBe(expected)
  })

  it('returns undefined for unknown, empty or missing roles', () => {
    expect(normalizeRole('User')).toBeUndefined()
    expect(normalizeRole('')).toBeUndefined()
    expect(normalizeRole(undefined)).toBeUndefined()
    expect(normalizeRole(null)).toBeUndefined()
  })
})

describe('normalizeRoles', () => {
  it('dedupes different spellings and returns canonical order', () => {
    expect(normalizeRoles(['STUDENT', 'Student', 'FINANCE', 'ADMIN', 'bogus'])).toEqual(['Admin', 'Finance', 'Student'])
  })
})

describe('canAccess', () => {
  it('denies when there is no rule (fail closed)', () => {
    expect(canAccess(undefined, ctx(['Admin'], ['x.y.z']))).toBe(false)
  })

  it('allows any signed-in user for an empty rule', () => {
    expect(canAccess({}, ctx())).toBe(true)
    expect(canAccess({ tasks: [], roles: [] }, ctx())).toBe(true)
  })

  it('checks tasks as any-of', () => {
    const rule = { tasks: ['finance.vouchers.view', 'finance.vouchers.generate'] }
    expect(canAccess(rule, ctx([], ['finance.vouchers.generate']))).toBe(true)
    expect(canAccess(rule, ctx([], ['finance.payments.view']))).toBe(false)
  })

  it('checks roles as any-of', () => {
    expect(canAccess({ roles: ['Student'] }, ctx(['Student']))).toBe(true)
    expect(canAccess({ roles: ['Student'] }, ctx(['Faculty']))).toBe(false)
  })

  it('accepts either a task or a role when both are present', () => {
    const rule = { tasks: ['results.result_headers.view'], roles: ['Student' as const] }
    expect(canAccess(rule, ctx(['Student'], []))).toBe(true)
    expect(canAccess(rule, ctx([], ['results.result_headers.view']))).toBe(true)
    expect(canAccess(rule, ctx(['Faculty'], ['exams.exams.view']))).toBe(false)
  })

  it('never grants from an empty task list alone', () => {
    expect(hasAnyTask(ctx([], ['a.b.c']), [])).toBe(false)
    expect(hasAnyRole(ctx(['Admin']), [])).toBe(false)
  })
})

describe('landing map', () => {
  it('is explicit for every role', () => {
    expect(LANDING_PATHS).toEqual({
      Admin: '/dashboard/admin',
      Registrar: '/dashboard/registrar',
      Faculty: '/dashboard/faculty',
      Student: '/dashboard/student',
      ExamCell: '/dashboard/examcell',
      Coordinator: '/dashboard/coordinator',
      Finance: '/finance',
      OfficeAssistant: '/dashboard/office-assistant',
    })
    expect(Object.keys(LANDING_PATHS).sort()).toEqual([...ALL_ROLES].sort())
  })

  it.each(ALL_ROLES)('landingPathFor(%s) uses the map', (role) => {
    expect(landingPathFor(role)).toBe(LANDING_PATHS[role])
  })

  it('resolves the backend primary-role strings, including Coordinator, Finance and OfficeAssistant', () => {
    expect(landingPathFor('Coordinator')).toBe('/dashboard/coordinator')
    expect(landingPathFor('Finance')).toBe('/finance')
    expect(landingPathFor('OfficeAssistant')).toBe('/dashboard/office-assistant')
  })

  it('falls back to the first effective role when the primary role is unknown', () => {
    expect(landingPathFor('User', ['Faculty'])).toBe('/dashboard/faculty')
  })

  it('returns undefined when nothing maps, so callers can show a message instead of looping', () => {
    expect(landingPathFor('User', [])).toBeUndefined()
    expect(landingPathFor(undefined)).toBeUndefined()
  })
})
