import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AttendanceInputPage } from './AttendanceInputPage'

vi.mock('@/components/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/services', () => ({
  attendanceInputService: {
    getRoster: vi.fn().mockResolvedValue({
      students: [
        { student_id: 1, reg_no: 'REG-001', name: 'Alice', status: null },
        { student_id: 2, reg_no: 'REG-002', name: 'Bob', status: null },
      ],
    }),
    submitLive: vi.fn().mockResolvedValue({ total: 2 }),
    csvDryRun: vi.fn(),
    csvCommit: vi.fn(),
    sheetDryRun: vi.fn(),
    sheetCommit: vi.fn(),
    templateUrl: (id: number) => `/template/${id}`,
  },
  sessionsService: {
    getAll: vi.fn().mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 10,
          academic_period: 1,
          group: 1,
          faculty: 1,
          department: 1,
          starts_at: new Date().toISOString(),
          ends_at: new Date().toISOString(),
          group_name: 'Group A',
        },
      ],
    }),
  },
}))

const renderPage = () => {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <AttendanceInputPage />
    </QueryClientProvider>
  )
}

describe('AttendanceInputPage', () => {
  it('renders tabs and session selector', async () => {
    renderPage()
    expect(await screen.findByText(/Attendance Input/i)).toBeInTheDocument()
    expect(await screen.findByRole('combobox')).toBeInTheDocument()
  })

  it('loads roster and toggles status', async () => {
    renderPage()
    await waitFor(() => expect((screen.getByRole('combobox') as HTMLSelectElement).value).not.toBe(''))
    const loadButton = await screen.findByText(/Load roster/i)
    fireEvent.click(loadButton)
    const toggle = (await screen.findAllByRole('button', { name: /^Present$/i }))[0]
    fireEvent.click(toggle)
    expect(toggle.textContent).toContain('Absent')
  })
})
