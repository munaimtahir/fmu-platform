import { beforeEach, expect, it, vi } from 'vitest'
import { getAccessContext } from './access'
import { dashboardApi } from './dashboard'
import * as faculty from './facultyImport'
import * as students from './studentImport'
import { startImpersonation, stopImpersonation, searchUsers } from './impersonation'
import { settingsApi } from './settings'
import { syllabusApi } from './syllabus'
import { usersApi } from './users'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('./axios', () => ({ default: api }))
const response = { id: 7, success: true }
beforeEach(() => { vi.resetAllMocks(); for (const method of Object.values(api)) method.mockResolvedValue({ data: response }) })

it('normalizes backend roles and extracts effective task codes', async () => {
  api.get.mockResolvedValue({ data: { roles: [{ name: 'ADMIN' }, { name: 'student' }], tasks: [{ code: 'students.students.view' }] } })
  expect(await getAccessContext()).toEqual({ roles: ['Admin', 'Student'], tasks: ['students.students.view'] })
  expect(api.get).toHaveBeenCalledWith('/api/core/users/me/')
})

const contracts: Array<[string, () => Promise<unknown>, keyof typeof api, unknown[]]> = [
  ['dashboard', dashboardApi.getStats, 'get', ['/api/dashboard/stats/']],
  ['admin dashboard', dashboardApi.getAdminDashboard, 'get', ['/api/admin/dashboard/']],
  ['start impersonation', () => startImpersonation(7), 'post', ['/api/admin/impersonation/start/', { target_user_id: 7 }]],
  ['stop impersonation', () => stopImpersonation(7), 'post', ['/api/admin/impersonation/stop/', { target_user_id: 7 }]],
  ['stop without target', () => stopImpersonation(), 'post', ['/api/admin/impersonation/stop/', {}]],
  ['search users', () => searchUsers('student'), 'get', ['/api/admin/users/search/', { params: { query: 'student' } }]],
  ['settings list', settingsApi.getAll, 'get', ['/api/admin/settings/']],
  ['setting detail', () => settingsApi.getByKey('theme'), 'get', ['/api/admin/settings/theme/']],
  ['setting update', () => settingsApi.update('theme', { value_json: 'light', value_type: 'string' }), 'patch', ['/api/admin/settings/theme/', { value_json: 'light', value_type: 'string' }]],
  ['setting create', () => settingsApi.create({ key: 'theme', value_json: 'light', value_type: 'string' }), 'post', ['/api/admin/settings/', { key: 'theme', value_json: 'light', value_type: 'string' }]],
  ['allowed settings', settingsApi.getAllowedKeys, 'get', ['/api/admin/settings/allowed_keys/']],
  ['syllabus list', () => syllabusApi.getAll({ page: 2 }), 'get', ['/api/admin/syllabus/', { params: { page: 2 } }]],
  ['syllabus detail', () => syllabusApi.getById(7), 'get', ['/api/admin/syllabus/7/']],
  ['syllabus create', () => syllabusApi.create({ title: 'Anatomy', order_no: 1 }), 'post', ['/api/admin/syllabus/', { title: 'Anatomy', order_no: 1 }]],
  ['syllabus update', () => syllabusApi.update(7, { title: 'Physiology' }), 'patch', ['/api/admin/syllabus/7/', { title: 'Physiology' }]],
  ['syllabus reorder', () => syllabusApi.reorder({ items: [{ id: 7, order_no: 2 }] }), 'post', ['/api/admin/syllabus/reorder/', { items: [{ id: 7, order_no: 2 }] }]],
  ['user list', () => usersApi.getAll({ role: 'Faculty', page: 2 }), 'get', ['/api/admin/users/', { params: { role: 'Faculty', page: 2 } }]],
  ['user detail', () => usersApi.getById(7), 'get', ['/api/admin/users/7/']],
  ['user create', () => usersApi.create({ username: 'f', email: 'f@example.edu', first_name: 'F', last_name: 'G', password: 'test-password', is_active: true, role: 'Faculty' }), 'post', ['/api/admin/users/', { username: 'f', email: 'f@example.edu', first_name: 'F', last_name: 'G', password: 'test-password', is_active: true, role: 'Faculty' }]],
  ['user update', () => usersApi.update(7, { is_active: false }), 'patch', ['/api/admin/users/7/', { is_active: false }]],
  ['password reset', () => usersApi.resetPassword(7, 'temporary'), 'post', ['/api/admin/users/7/reset-password/', { temporary_password: 'temporary', temporary_password_confirm: 'temporary' }]],
  ['user activation', () => usersApi.activate(7), 'post', ['/api/admin/users/7/activate/']],
  ['user deactivation', () => usersApi.deactivate(7), 'post', ['/api/admin/users/7/deactivate/']],
]
it.each(contracts)('%s preserves the backend request and response contract', async (_name, call, method, args) => {
  expect(await call()).toEqual(response)
  expect(api[method]).toHaveBeenCalledWith(...args)
  const error = new Error('backend unavailable')
  api[method].mockRejectedValueOnce(error)
  await expect(call()).rejects.toBe(error)
})

it.each([['syllabus', syllabusApi], ['users', usersApi]] as const)('deletes %s without returning a stale body', async (resource, service) => {
  expect(await service.delete(7)).toBeUndefined()
  expect(api.delete).toHaveBeenCalledWith(`/api/admin/${resource}/7/`)
})

it.each([['students', students], ['faculty', faculty]] as const)('supports %s import preview, history and downloadable artifacts', async (resource, service) => {
  const file = new File(['id,name\n1,Test'], 'input.csv', { type: 'text/csv' })
  expect(await service.previewImport(file)).toEqual(response)
  expect(api.post.mock.lastCall![0]).toBe(`/api/admin/${resource}/import/preview/`)
  expect((api.post.mock.lastCall![1] as FormData).get('file')).toBe(file)
  if (resource === 'faculty') expect((api.post.mock.lastCall![1] as FormData).get('mode')).toBe('CREATE_ONLY')
  expect(await service.listImportJobs()).toEqual(response)
  expect(api.get).toHaveBeenLastCalledWith(`/api/admin/${resource}/import/jobs/`)
  expect(await service.getImportJob('job-1')).toEqual(response)
  expect(api.get).toHaveBeenLastCalledWith(`/api/admin/${resource}/import/job-1/detail/`)
  expect(await service.downloadTemplate()).toEqual(response)
  expect(api.get).toHaveBeenLastCalledWith(`/api/admin/${resource}/import/template/`, { responseType: 'blob' })
  expect(await service.downloadErrorReport('job-1')).toEqual(response)
  expect(api.get).toHaveBeenLastCalledWith(`/api/admin/${resource}/import/job-1/errors.csv/`, { responseType: 'blob' })
})

it('requires the original file when committing student imports and supports explicit confirmation', async () => {
  const file = new File(['csv'], 'students.csv')
  for (const confirm of [undefined, false]) {
    expect(await students.commitImport('job-1', file, confirm)).toEqual(response)
    const [url, payload] = api.post.mock.lastCall!
    expect(url).toBe('/api/admin/students/import/commit/')
    expect(payload.get('import_job_id')).toBe('job-1')
    expect(payload.get('file')).toBe(file)
    expect(payload.get('confirm')).toBe(String(confirm ?? true))
  }
  expect(await faculty.commitImport('job-1')).toEqual(response)
  expect(api.post).toHaveBeenLastCalledWith('/api/admin/faculty/import/commit/', { import_job_id: 'job-1', confirm: true })
  await faculty.commitImport('job-1', false)
  expect(api.post).toHaveBeenLastCalledWith('/api/admin/faculty/import/commit/', { import_job_id: 'job-1', confirm: false })
})
