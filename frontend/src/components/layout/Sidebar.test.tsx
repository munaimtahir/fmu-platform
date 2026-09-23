import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/hooks', () => ({ useUnreadNotificationsCount: () => 0 }))
vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))

import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/features/auth/authStore'
import type { RoleName } from '@/features/auth/access'

function renderSidebar(role: string, roles: RoleName[], tasks: string[]) {
  useAuthStore.setState({
    user: { id: 1, username: 'u', email: 'u@e.edu', full_name: 'User', role, is_active: true },
    isAuthenticated: true,
    isLoading: false,
    roles,
    tasks,
    accessLoaded: true,
  })
  // Expand every group so links are in the DOM.
  localStorage.setItem(
    'sidebarExpandedGroups',
    JSON.stringify(['Students', 'Academics', 'Attendance', 'Learning', 'Exams & Results', 'Finance', 'Communication', 'Administration', 'Timetable'])
  )
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Sidebar isOpen onToggle={() => undefined} />
    </MemoryRouter>
  )
}

const link = (name: string) => screen.queryByRole('link', { name })

describe('Sidebar capability filtering', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('shows a student only student-facing entries', () => {
    renderSidebar('Student', ['Student'], ['learning.feed.view', 'notifications.inbox.view', 'timetable.weekly.view'])
    expect(link('My Compliance')).toBeInTheDocument()
    expect(link('My Learning')).toBeInTheDocument()
    expect(link('My Fees')).toBeInTheDocument()
    expect(link('Timetable')).toBeInTheDocument()
    expect(link('Users')).not.toBeInTheDocument()
    expect(link('Payments')).not.toBeInTheDocument()
    expect(link('Compliance')).not.toBeInTheDocument()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })

  it('shows Finance staff the finance pages their tasks allow, and no administration group', () => {
    renderSidebar(
      'Finance',
      ['Finance'],
      ['finance.summary.view', 'finance.vouchers.view', 'finance.vouchers.generate', 'finance.payments.view', 'finance.reports.view']
    )
    expect(link('Finance Dashboard')).toBeInTheDocument()
    expect(link('Payments')).toBeInTheDocument()
    expect(link('Voucher Generation')).toBeInTheDocument()
    expect(link('Ledger')).not.toBeInTheDocument()
    expect(link('Fee Types')).not.toBeInTheDocument()
    expect(link('Users')).not.toBeInTheDocument()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })

  it('reveals discoverable pages when the matching task is held', () => {
    renderSidebar('Registrar', ['Registrar'], [
      'people.persons.view',
      'students.students.view',
      'compliance.requirements.view',
      'notifications.admin.view',
      'attendance.attendances.view',
    ])
    expect(link('People')).toBeInTheDocument()
    expect(link('Compliance')).toBeInTheDocument()
    expect(link('Notification Administration')).toBeInTheDocument()
    expect(link('Eligibility Report')).toBeInTheDocument()
  })

  it('shows the Administration group items by task or role', () => {
    renderSidebar('Admin', ['Admin'], ['core.roles.view', 'audit.events.view'])
    expect(link('Users')).toBeInTheDocument()
    expect(link('Roles & Permissions')).toBeInTheDocument()
    expect(link('Audit Logs')).toBeInTheDocument()
    expect(link('Settings')).toBeInTheDocument()
    expect(link('Syllabus')).toBeInTheDocument()
    expect(link('Student Import')).not.toBeInTheDocument()
  })

  it('hides ExamCell transcripts unless the task is explicitly held', () => {
    renderSidebar('ExamCell', ['ExamCell'], ['exams.exams.view', 'results.result_headers.view'])
    expect(link('Transcripts')).not.toBeInTheDocument()
  })

  it('shows student import when the import task is granted', () => {
    renderSidebar('Coordinator', ['Coordinator'], ['students.imports.view'])
    expect(link('Student Import')).toBeInTheDocument()
  })

  it('shows transcripts to an ExamCell user who holds the generate task', () => {
    renderSidebar('ExamCell', ['ExamCell'], ['transcripts.transcripts.generate'])
    expect(link('Transcripts')).toBeInTheDocument()
  })

  it('hides an entire group when none of its entries are accessible', () => {
    renderSidebar('Faculty', ['Faculty'], ['timetable.entries.view'])
    expect(screen.queryByText('Finance')).not.toBeInTheDocument()
    expect(screen.queryByText('Communication')).not.toBeInTheDocument()
  })
})
