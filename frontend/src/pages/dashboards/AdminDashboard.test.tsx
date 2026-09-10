import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminDashboard } from './AdminDashboard'
import * as authModule from '@/features/auth/useAuth'

vi.mock('@/components/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/features/auth/useAuth')

const listResponse = (count: number) => ({ count, next: null, previous: null, results: [] })

vi.mock('@/services', () => ({
  studentsService: { getAll: vi.fn().mockResolvedValue({ count: 120, next: null, previous: null, results: [] }) },
  programsService: { getAll: vi.fn().mockResolvedValue({ count: 5, next: null, previous: null, results: [] }) },
  coursesService: { getAll: vi.fn().mockResolvedValue({ count: 40, next: null, previous: null, results: [] }) },
  sectionsService: { getAll: vi.fn().mockResolvedValue({ count: 8, next: null, previous: null, results: [] }) },
  sessionsService: { getAll: vi.fn().mockResolvedValue({ count: 200, next: null, previous: null, results: [] }) },
  resultsService: {
    getAll: vi.fn().mockResolvedValue({ count: 10, next: null, previous: null, results: [] }),
  },
}))

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getAdminDashboard: vi.fn().mockResolvedValue({
      counts: { students: 120, faculty: 15, programs: 5, courses: 40 },
      attendance_stats: {
        last_7_days: { total_marked: 300, absent_percent: 4, late_percent: 2, missing_entries: 1 },
      },
      recent_activity: [
        { id: '1', actor: 'admin', action: 'CREATE', entity: 'Student', timestamp: new Date().toISOString(), summary: 'Created a student' },
      ],
      system: { app_version: 'abc123', server_time: new Date().toISOString(), env_label: 'production', django_version: '5.0' },
    }),
  },
}))

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AdminDashboard', () => {
  it('renders merged stats, attendance summary, recent activity, and system info', async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: { full_name: 'Test Admin' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as any)

    renderPage()

    expect(await screen.findByText('120')).toBeInTheDocument() // Total Students
    expect(await screen.findByText('15')).toBeInTheDocument() // Total Faculty (merged from AdminDashboardPage)
    expect(await screen.findByText(/Attendance Summary/i)).toBeInTheDocument()
    expect(await screen.findByText(/Recent Activity/i)).toBeInTheDocument()
    expect(await screen.findByText('Created a student')).toBeInTheDocument()
    expect(await screen.findByText(/System Information/i)).toBeInTheDocument()
    expect(await screen.findByText('abc123')).toBeInTheDocument()
  })
})
