import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changePassword, getCurrentUser, login, logout, refreshTokens, updateProfile } from './auth'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), setTokens: vi.fn(), clearTokens: vi.fn(), refresh: vi.fn() }))
vi.mock('./axios', () => ({ default: mocks, setTokens: mocks.setTokens, clearTokens: mocks.clearTokens, getRefreshToken: mocks.refresh }))
beforeEach(() => { vi.resetAllMocks() })
const credentials = { identifier: 'student', password: 'old-secret' }
const password = { old_password: 'old', new_password: 'new', new_password_confirm: 'new' }

it('persists login and password-change tokens only after success', async () => {
  const response = { user: { id: 4 }, tokens: { access: 'access', refresh: 'refresh' } }
  mocks.post.mockResolvedValue({ data: response })
  expect(await login(credentials)).toEqual(response)
  expect(mocks.post).toHaveBeenCalledWith('/api/auth/login/', credentials)
  expect(mocks.setTokens).toHaveBeenCalledWith('access', 'refresh')
  expect(await changePassword(password)).toEqual(response)
  expect(mocks.post).toHaveBeenLastCalledWith('/api/auth/change-password/', password)
})

describe.each([
  ['login', () => login(credentials)], ['password change', () => changePassword(password)], ['profile update', () => updateProfile({ first_name: 'A' })],
] as const)('%s errors', (_name, operation) => {
  it.each([null, 'offline', new Error('network'), { response: null }, { response: { data: 'bad gateway' } }, { response: { data: null } }, { response: { data: {} } }])('preserves unknown transport error %#', async error => {
    mocks.post.mockRejectedValue(error)
    mocks.patch.mockRejectedValue(error)
    await expect(operation()).rejects.toBe(error)
    expect(mocks.setTokens).not.toHaveBeenCalled()
  })
  it('exposes the backend validation message', async () => {
    const error = { response: { data: { error: { code: 'invalid', message: 'Permission denied' } } } }
    mocks.post.mockRejectedValue(error)
    mocks.patch.mockRejectedValue(error)
    await expect(operation()).rejects.toThrow('Permission denied')
  })
})

it.each([null, 'refresh'])('always clears local tokens on logout with token %s', async token => {
  mocks.refresh.mockReturnValue(token)
  mocks.post.mockRejectedValue(new Error('offline'))
  await logout()
  expect(mocks.clearTokens).toHaveBeenCalledOnce()
  if (token) expect(mocks.post).toHaveBeenCalledWith('/api/auth/logout/', { refresh: token })
  else expect(mocks.post).not.toHaveBeenCalled()
})

it('clears tokens after successful logout too', async () => {
  mocks.refresh.mockReturnValue('refresh')
  mocks.post.mockResolvedValue({ data: {} })
  await logout()
  expect(mocks.clearTokens).toHaveBeenCalledOnce()
})

it('rejects refresh without credentials without sending a request', async () => {
  await expect(refreshTokens()).rejects.toThrow('No refresh token available')
  expect(mocks.post).not.toHaveBeenCalled()
})

it.each([undefined, 'rotated'])('refreshes access and preserves or rotates refresh token: %s', async refresh => {
  mocks.refresh.mockReturnValue('original')
  mocks.post.mockResolvedValue({ data: { access: 'new-access', refresh } })
  expect(await refreshTokens()).toEqual({ access: 'new-access', refresh })
  expect(mocks.post).toHaveBeenCalledWith('/api/auth/refresh/', { refresh: 'original' })
  expect(mocks.setTokens).toHaveBeenCalledWith('new-access', refresh || 'original')
})

it('invalidates credentials after rejected refresh', async () => {
  const error = new Error('expired')
  mocks.refresh.mockReturnValue('expired')
  mocks.post.mockRejectedValue(error)
  await expect(refreshTokens()).rejects.toBe(error)
  expect(mocks.clearTokens).toHaveBeenCalledOnce()
})

it('returns current identity, tolerates unavailable identity, and updates a profile', async () => {
  mocks.get.mockResolvedValueOnce({ data: { id: 1 } }).mockRejectedValueOnce(new Error('unauthorized'))
  expect(await getCurrentUser()).toEqual({ id: 1 })
  expect(mocks.get).toHaveBeenCalledWith('/api/auth/me/')
  expect(await getCurrentUser()).toBeNull()
  mocks.patch.mockResolvedValue({ data: { id: 1, first_name: 'A' } })
  expect(await updateProfile({ first_name: 'A' })).toEqual({ id: 1, first_name: 'A' })
  expect(mocks.patch).toHaveBeenCalledWith('/api/auth/me/', { first_name: 'A' })
})

it('handles password validation errors without a code and preserves malformed error details', async () => {
  mocks.post.mockRejectedValueOnce({ response: { data: { error: { message: 'Passwords differ' } } } })
  await expect(changePassword(password)).rejects.toThrow('Passwords differ')
  for (const value of [null, 'invalid', {}, { code: 'invalid' }]) {
    const error = { response: { data: { error: value } } }
    mocks.post.mockRejectedValueOnce(error)
    await expect(changePassword(password)).rejects.toBe(error)
  }
})
