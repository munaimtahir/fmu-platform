import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))

import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from './authStore'
import type { RoleName } from './access'

const user = { id: 1, username: 'u', email: 'u@e.edu', full_name: 'U', role: 'Registrar', is_active: true }

function signIn(roles: RoleName[], tasks: string[], accessLoaded = true) {
  useAuthStore.setState({ user, isAuthenticated: true, isLoading: false, roles, tasks, accessLoaded })
}

function renderAt(path: string, guardPath: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path={path}
          element={
            <ProtectedRoute path={guardPath}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to login when not authenticated', async () => {
    renderAt('/students', '/students')
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument())
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('waits for the access context instead of rendering or denying early', () => {
    signIn([], [], false)
    renderAt('/students', '/students')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('renders children when the user holds a required task', async () => {
    signIn(['Registrar'], ['students.students.view'])
    renderAt('/students', '/students')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })

  it('shows Access Denied when the user lacks the required task', async () => {
    signIn(['Faculty'], ['exams.exams.view'])
    renderAt('/finance/payments', '/finance/payments')
    expect(await screen.findByText('Access Denied', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows a self-service route by role', async () => {
    signIn(['Student'], [])
    renderAt('/my-compliance', '/my-compliance')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })

  it('denies a route that is not registered (fails closed)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    signIn(['Admin'], ['students.students.view'])
    renderAt('/not-registered', '/not-registered')
    expect(await screen.findByText('Access Denied', { selector: 'h2' })).toBeInTheDocument()
  })

  it('lets any signed-in user open an unrestricted route', async () => {
    signIn([], [])
    renderAt('/profile', '/profile')
    expect(await screen.findByText('Protected Content')).toBeInTheDocument()
  })
})
