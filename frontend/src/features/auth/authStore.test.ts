import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))

import { useAuthStore } from './authStore'
import { getAccessToken } from '@/api/axios'
import { getCurrentUser } from '@/api/auth'
import { getAccessContext } from '@/api/access'
import type { User } from './types'

const user: User = { id: 1, username: 'u', email: 'u@e.edu', full_name: 'U', role: 'Registrar', is_active: true }

describe('authStore access context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
  })

  it('loadAccess stores effective roles and tasks', async () => {
    vi.mocked(getAccessContext).mockResolvedValue({ roles: ['Registrar'], tasks: ['students.students.view'] })
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().accessLoaded).toBe(false)

    await useAuthStore.getState().loadAccess()

    const state = useAuthStore.getState()
    expect(state.roles).toEqual(['Registrar'])
    expect(state.tasks).toEqual(['students.students.view'])
    expect(state.accessLoaded).toBe(true)
  })

  it('degrades to the primary role with no tasks when the access call fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(getAccessContext).mockRejectedValue(new Error('boom'))
    useAuthStore.getState().setUser(user)

    await useAuthStore.getState().loadAccess()

    const state = useAuthStore.getState()
    expect(state.roles).toEqual(['Registrar'])
    expect(state.tasks).toEqual([])
    expect(state.accessLoaded).toBe(true)
  })

  it('loadAccess with no user clears access', async () => {
    await useAuthStore.getState().loadAccess()
    expect(getAccessContext).not.toHaveBeenCalled()
    expect(useAuthStore.getState()).toMatchObject({ roles: [], tasks: [], accessLoaded: true })
  })

  it('setUser invalidates a previously loaded access context', async () => {
    vi.mocked(getAccessContext).mockResolvedValue({ roles: ['Admin'], tasks: ['a.b.c'] })
    useAuthStore.getState().setUser(user)
    await useAuthStore.getState().loadAccess()
    useAuthStore.getState().setUser({ ...user, id: 2 })
    expect(useAuthStore.getState().accessLoaded).toBe(false)
  })

  it('logout clears roles, tasks and the loaded flag', async () => {
    vi.mocked(getAccessContext).mockResolvedValue({ roles: ['Admin'], tasks: ['a.b.c'] })
    useAuthStore.getState().setUser(user)
    await useAuthStore.getState().loadAccess()

    useAuthStore.getState().logout()

    expect(useAuthStore.getState()).toMatchObject({ roles: [], tasks: [], accessLoaded: false, isAuthenticated: false })
  })

  it('session restore loads the user and the access context before finishing', async () => {
    vi.mocked(getAccessToken).mockReturnValue('token')
    vi.mocked(getCurrentUser).mockResolvedValue(user)
    vi.mocked(getAccessContext).mockResolvedValue({ roles: ['Registrar'], tasks: ['compliance.requirements.view'] })

    await useAuthStore.getState().initialize()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
    expect(state.accessLoaded).toBe(true)
    expect(state.tasks).toEqual(['compliance.requirements.view'])
  })

  it('initialize is a no-op once a session and its access are loaded', async () => {
    vi.mocked(getAccessToken).mockReturnValue('token')
    vi.mocked(getCurrentUser).mockResolvedValue(user)
    vi.mocked(getAccessContext).mockResolvedValue({ roles: ['Registrar'], tasks: [] })
    await useAuthStore.getState().initialize()
    vi.clearAllMocks()

    await useAuthStore.getState().initialize()

    expect(getCurrentUser).not.toHaveBeenCalled()
    expect(getAccessContext).not.toHaveBeenCalled()
  })

  it('initialize without a token leaves the user signed out', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null)
    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, isLoading: false })
  })
})
