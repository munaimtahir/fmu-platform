import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import * as authModule from './useAuth'

// Mock useAuth hook
vi.mock('./useAuth')

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock useAuth hook
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      initialize: vi.fn(),
    })
  })

  it('should render login form with identifier field', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email or username is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should call login function with identifier credential', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'Student',
        is_active: true,
      },
      tokens: { access: 'token', refresh: 'token' }
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(identifierInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password123',
      })
    })
  })

  it('should call login function with email as identifier', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'Student',
        is_active: true,
      },
      tokens: { access: 'token', refresh: 'token' }
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(identifierInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should navigate to dashboard after successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'Student',
        is_active: true,
      },
      tokens: { access: 'token', refresh: 'token' }
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(identifierInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Invalid username/email or password.'))

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/email or username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(identifierInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid username\/email or password/i)).toBeInTheDocument()
    })
  })
})
