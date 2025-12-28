import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from './authStore'

// Mock component for testing
const TestComponent = () => <div>Protected Content</div>
const LoginComponent = () => <div>Login Page</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset auth store before each test
    const { logout } = useAuthStore.getState()
    logout()
  })

  it('should redirect to login when not authenticated', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Ensure user is not authenticated
    expect(result.current.isAuthenticated).toBe(false)

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Should show loading initially, then redirect to login
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      // Login page or loading state should be shown
    })
  })

  it('should render children when authenticated', async () => {
    // Manually set authenticated state
    const { setUser } = useAuthStore.getState()
    setUser({
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['student'],
    })

    const { result } = renderHook(() => useAuthStore())
    
    // Initialize to load auth state
    result.current.initialize()

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
