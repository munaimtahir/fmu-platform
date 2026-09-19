import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/authStore'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/api/axios', () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  isImpersonating: vi.fn(() => false),
  restoreAdminTokens: vi.fn(),
}))
vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/api/access', () => ({ getAccessContext: vi.fn() }))
vi.mock('@/api/impersonation', () => ({ stopImpersonation: vi.fn() }))
vi.mock('@/services/notificationsAdmin', async () => {
  const actual = await vi.importActual<typeof import('@/services/notificationsAdmin')>('@/services/notificationsAdmin')
  return {
    ...actual,
    notificationsAdminService: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      send: vi.fn(),
      lookupFor: vi.fn().mockResolvedValue([]),
    },
  }
})

import { notificationsAdminService, type AdminNotification } from '@/services/notificationsAdmin'
import { NotificationAdminPage } from './NotificationAdminPage'

const draft: AdminNotification = {
  id: 1,
  title: 'Fee deadline',
  body: 'Pay by Friday.',
  category: 'Finance',
  priority: 'HIGH',
  created_by: 1,
  created_by_name: 'registrar',
  send_email: false,
  publish_at: null,
  expires_at: null,
  status: 'DRAFT',
  created_at: '2026-09-01T10:00:00Z',
  audiences: [{ id: 1, audience_type: 'ALL_STUDENTS', student: null, section: null, batch: null, program: null, group: null, filters_json: null }],
}
const sent: AdminNotification = { ...draft, id: 2, title: 'Welcome', status: 'SENT' }

function signIn(tasks: string[]) {
  useAuthStore.setState({
    user: { id: 1, username: 'reg', email: 'r@e.edu', full_name: 'Reg', role: 'Registrar', is_active: true },
    isAuthenticated: true,
    isLoading: false,
    roles: ['Registrar'],
    tasks,
    accessLoaded: true,
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationAdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NotificationAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    vi.mocked(notificationsAdminService.list).mockResolvedValue({ count: 2, next: null, previous: null, results: [draft, sent] })
  })

  it('lists notifications with status and audience', async () => {
    signIn(['notifications.admin.view'])
    renderPage()
    expect(await screen.findByText('Fee deadline')).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getAllByText('All students').length).toBeGreaterThan(0)
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('view-only users get no compose or send controls', async () => {
    signIn(['notifications.admin.view'])
    renderPage()
    await screen.findByText('Fee deadline')
    expect(screen.queryByRole('button', { name: 'New notification' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send Fee deadline/ })).not.toBeInTheDocument()
  })

  it('offers Send only for unsent notifications and only with the send task', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.send'])
    renderPage()
    await screen.findByText('Fee deadline')
    expect(screen.getByRole('button', { name: 'Send Fee deadline' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Welcome' })).not.toBeInTheDocument()
  })

  it('confirms before queueing a send, then calls the API', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.send'])
    vi.mocked(notificationsAdminService.send).mockResolvedValue({ ...draft, status: 'QUEUED' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Send Fee deadline' }))

    expect(notificationsAdminService.send).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(notificationsAdminService.send).toHaveBeenCalledWith(1))
  })

  it('shows the backend message when a send fails and keeps the dialog open', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.send'])
    vi.mocked(notificationsAdminService.send).mockRejectedValue(new Error('Queue unavailable'))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Send Fee deadline' }))
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Queue unavailable')).toBeInTheDocument()
  })

  it('opens a detail view', async () => {
    signIn(['notifications.admin.view'])
    vi.mocked(notificationsAdminService.get).mockResolvedValue(draft)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'View Fee deadline' }))
    expect(await screen.findByText('Pay by Friday.')).toBeInTheDocument()
    expect(screen.getByText('registrar')).toBeInTheDocument()
  })

  it('shows an empty state and an error state', async () => {
    signIn(['notifications.admin.view'])
    vi.mocked(notificationsAdminService.list).mockResolvedValueOnce({ count: 0, next: null, previous: null, results: [] })
    const first = renderPage()
    expect(await screen.findByText('No notifications')).toBeInTheDocument()
    first.unmount()

    vi.mocked(notificationsAdminService.list).mockRejectedValueOnce(new Error('Server down'))
    renderPage()
    expect(await screen.findByText('Could not load notifications')).toBeInTheDocument()
  })

  it('validates the compose form before calling the API', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.create'])
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'New notification' }))

    // Only drafts are possible without the send task.
    expect(screen.queryByRole('button', { name: 'Send now' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }))

    expect(await screen.findByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()
    expect(notificationsAdminService.create).not.toHaveBeenCalled()
  })

  it('saves a draft with the backend payload', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.create'])
    vi.mocked(notificationsAdminService.create).mockResolvedValue(draft)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'New notification' }))
    await userEvent.type(screen.getByLabelText(/^Title/), 'Timetable change')
    await userEvent.type(screen.getByLabelText(/^Message/), 'Room moved.')
    await userEvent.click(screen.getByRole('button', { name: 'Save as draft' }))

    await waitFor(() => expect(notificationsAdminService.create).toHaveBeenCalledTimes(1))
    expect(vi.mocked(notificationsAdminService.create).mock.calls[0][0]).toMatchObject({
      title: 'Timetable change',
      body: 'Room moved.',
      category: 'General',
      send_now: false,
      audiences: [{ audience_type: 'ALL_STUDENTS' }],
    })
  })

  it('Send now asks for confirmation and then creates with send_now', async () => {
    signIn(['notifications.admin.view', 'notifications.admin.create', 'notifications.admin.send'])
    vi.mocked(notificationsAdminService.create).mockResolvedValue({ ...draft, status: 'QUEUED' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'New notification' }))
    await userEvent.type(screen.getByLabelText(/^Title/), 'Urgent')
    await userEvent.type(screen.getByLabelText(/^Message/), 'Read this.')
    await userEvent.click(screen.getByRole('button', { name: 'Send now' }))

    expect(notificationsAdminService.create).not.toHaveBeenCalled()
    expect(await screen.findByText('Send notification now?')).toBeInTheDocument()
    const confirmButtons = screen.getAllByRole('button', { name: 'Send now' })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(notificationsAdminService.create).toHaveBeenCalledTimes(1))
    expect(vi.mocked(notificationsAdminService.create).mock.calls[0][0]).toMatchObject({ send_now: true, title: 'Urgent' })
  })
})
