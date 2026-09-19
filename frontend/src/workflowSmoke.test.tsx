import { describe, expect, it } from 'vitest'
import { LANDING_PATHS, normalizeRole } from '@/features/auth/access'
import { routeAccess } from '@/config/routeAccess'

describe('web workflow contract smoke checks', () => {
  it('has a landing route for every supported role', () => {
    for (const role of ['Admin', 'Registrar', 'Coordinator', 'Faculty', 'ExamCell', 'Finance', 'Student', 'OfficeAssistant']) {
      expect(LANDING_PATHS[normalizeRole(role)]).toBeTruthy()
    }
  })

  it('keeps business routes fail-closed with explicit access rules', () => {
    expect(routeAccess['/learning']).toBeDefined()
    expect(routeAccess['/learning/manage']).toBeDefined()
    expect(routeAccess['/gradebook']).toBeDefined()
    expect(routeAccess['/system/faculty/import']).toBeDefined()
    expect(routeAccess['/apply']).toBeUndefined()
  })
})
