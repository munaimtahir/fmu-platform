import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/authStore'
import type { RoleName } from '@/features/auth/access'

vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))
vi.mock('@/api/dashboard', () => ({ dashboardApi: { getStats: vi.fn() } }))

import { dashboardApi } from '@/api/dashboard'
import { RegistrarDashboard } from './RegistrarDashboard'
import { ExamCellDashboard } from './ExamCellDashboard'
import { CoordinatorDashboard } from './CoordinatorDashboard'
import { OfficeAssistantDashboard } from './OfficeAssistantDashboard'

function signIn(role: string, roles: RoleName[], tasks: string[]) {
  useAuthStore.setState({
    user: { id: 1, username: 'u', email: 'u@e.edu', full_name: 'Sam Lee', role, is_active: true },
    isAuthenticated: true,
    isLoading: false,
    roles,
    tasks,
    accessLoaded: true,
  })
}

function renderPage(page: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{page}</MemoryRouter>
    </QueryClientProvider>
  )
}

const statValue = (label: string) => {
  const card = screen.getByText(label).closest('div')!.parentElement!
  return within(card).getAllByText(/^[\d,]+$/)[0].textContent
}

describe('backend-driven role dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
  })

  it('Registrar dashboard shows the backend counts and none of the old sample data', async () => {
    signIn('Registrar', ['Registrar'], ['students.students.view', 'compliance.requirements.view'])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      active_students: 412,
      students_on_leave: 7,
      pending_compliance_reviews: 19,
      pending_result_corrections: 3,
      total_programs: 4,
      total_batches: 11,
    })
    renderPage(<RegistrarDashboard />)

    expect(await screen.findByText('Active Students')).toBeInTheDocument()
    expect(statValue('Active Students')).toBe('412')
    expect(statValue('Students on Leave')).toBe('7')
    expect(statValue('Compliance Awaiting Review')).toBe('19')
    expect(statValue('Batches')).toBe('11')
    for (const stale of ['1,189', '3,456', 'Alice Johnson', 'Bob Williams', 'Pending Registrations']) {
      expect(screen.queryByText(stale)).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Welcome, Sam Lee/)).toBeInTheDocument()
  })

  it('only offers shortcuts to routes the user can open', async () => {
    signIn('Registrar', ['Registrar'], ['students.students.view', 'compliance.requirements.view'])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ active_students: 1 })
    renderPage(<RegistrarDashboard />)

    expect(await screen.findByRole('link', { name: /Students Search and manage/ })).toHaveAttribute('href', '/students')
    expect(screen.getByRole('link', { name: /Compliance review/ })).toHaveAttribute('href', '/compliance')
    // Route rules: /people needs people.persons.view, /notifications/manage needs notifications.admin.view.
    expect(screen.queryByRole('link', { name: /People/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Notifications/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Result corrections/ })).not.toBeInTheDocument()
  })

  it('ExamCell dashboard shows exam and result counts', async () => {
    signIn('ExamCell', ['ExamCell'], ['exams.exams.view', 'results.result_headers.view', 'results.result_headers.publish'])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      total_exams: 9,
      unpublished_exams: 2,
      draft_results: 30,
      verified_results: 12,
      published_results: 100,
      frozen_results: 1,
      pending_result_corrections: 4,
    })
    renderPage(<ExamCellDashboard />)

    expect(await screen.findByText('Verified, Awaiting Publication')).toBeInTheDocument()
    expect(statValue('Verified, Awaiting Publication')).toBe('12')
    expect(statValue('Published Results')).toBe('100')
    expect(statValue('Pending Corrections')).toBe('4')
    expect(screen.queryByText('CS301')).not.toBeInTheDocument()
    expect(screen.queryByText('MATH201')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Verify & publish results/ })).toHaveAttribute('href', '/examcell/publish')
    expect(screen.queryByRole('link', { name: /Transcripts/ })).not.toBeInTheDocument()
  })

  it('Coordinator dashboard shows org stats and coordinator links', async () => {
    signIn('Coordinator', ['Coordinator'], ['timetable.weekly.view', 'students.students.view', 'notifications.admin.view'])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({
      total_students: 300,
      total_programs: 2,
      total_batches: 5,
      total_groups: 14,
      total_sessions: 88,
      total_exams: 6,
      published_results: 40,
      draft_results: 8,
      total_vouchers: 999,
    })
    renderPage(<CoordinatorDashboard />)

    expect(await screen.findByText('Timetable Sessions')).toBeInTheDocument()
    expect(statValue('Groups')).toBe('14')
    expect(statValue('Timetable Sessions')).toBe('88')
    // Finance figures are not part of the coordinator view.
    expect(screen.queryByText(/voucher/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Timetable Sessions, weekly/ })).toHaveAttribute('href', '/timetable')
    expect(screen.getByRole('link', { name: /Student import/ })).toHaveAttribute('href', '/system/students/import')
  })

  it('OfficeAssistant dashboard shows data-entry stats', async () => {
    signIn('OfficeAssistant', ['OfficeAssistant'], [])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ total_sessions: 12, draft_results: 5, total_exams: 3 })
    renderPage(<OfficeAssistantDashboard />)

    expect(await screen.findByText('Draft Results')).toBeInTheDocument()
    expect(statValue('Timetable Sessions')).toBe('12')
    expect(statValue('Unpublished Exams')).toBe('3')
  })

  it('hides a stat the backend did not return', async () => {
    signIn('Registrar', ['Registrar'], [])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ active_students: 5 })
    renderPage(<RegistrarDashboard />)
    expect(await screen.findByText('Active Students')).toBeInTheDocument()
    expect(screen.queryByText('Batches')).not.toBeInTheDocument()
  })

  it('shows the backend message and an empty state when there are no stats', async () => {
    signIn('Registrar', ['Registrar'], [])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({ message: 'No statistics available for your role' })
    renderPage(<RegistrarDashboard />)
    expect(await screen.findByText('No statistics available for your role')).toBeInTheDocument()
  })

  it('shows an empty state for an empty response', async () => {
    signIn('Registrar', ['Registrar'], [])
    vi.mocked(dashboardApi.getStats).mockResolvedValue({})
    renderPage(<RegistrarDashboard />)
    expect(await screen.findByText('No statistics available')).toBeInTheDocument()
  })

  it('shows a loading state, then an error with retry', async () => {
    signIn('ExamCell', ['ExamCell'], [])
    vi.mocked(dashboardApi.getStats).mockRejectedValue(new Error('Network down'))
    renderPage(<ExamCellDashboard />)
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    expect(await screen.findByText('Could not load dashboard')).toBeInTheDocument()
    expect(screen.getByText('Network down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
