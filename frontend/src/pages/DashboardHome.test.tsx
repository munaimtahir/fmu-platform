import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))

import { DashboardHome } from './DashboardHome'
import { useAuthStore } from '@/features/auth/authStore'
import { LANDING_PATHS, normalizeRoles } from '@/features/auth/access'

const Where = () => <div data-testid="where">{useLocation().pathname}</div>

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

function signInAs(role: string) {
  useAuthStore.setState({
    user: { id: 1, username: 'u', email: 'u@e.edu', full_name: 'U', role, is_active: true },
    isAuthenticated: true,
    isLoading: false,
    roles: normalizeRoles([role]),
    tasks: [],
    accessLoaded: true,
  })
}

describe('DashboardHome role landing', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it.each(Object.entries(LANDING_PATHS))('sends %s to %s', (role, path) => {
    signInAs(role)
    renderHome()
    expect(screen.getByTestId('where')).toHaveTextContent(path)
  })

  it('explains instead of looping when the account has no mapped role', () => {
    signInAs('User')
    renderHome()
    expect(screen.queryByTestId('where')).not.toBeInTheDocument()
    expect(screen.getByText(/no dashboard to show/i)).toBeInTheDocument()
  })

  it('no longer renders the retired Stage-2..5 progress cards', () => {
    signInAs('User')
    renderHome()
    expect(screen.queryByText(/Stage-\d/i)).not.toBeInTheDocument()
  })
})
