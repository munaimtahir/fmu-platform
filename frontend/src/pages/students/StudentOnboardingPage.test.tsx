import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentOnboardingPage } from './StudentOnboardingPage'
import { onboardingService, type OnboardingPayload } from '@/services/onboarding'

vi.mock('@/services/onboarding', () => ({ onboardingService: { get: vi.fn(), updateProfile: vi.fn(), submitDocument: vi.fn(), documentDownloadPath: vi.fn() } }))

const payload: OnboardingPayload = {
  student: { id: 1, reg_no: 'ONB-1', program_name: 'MBBS', batch_name: '2026' },
  profile: { first_name: 'Amina', middle_name: '', last_name: 'Khan', date_of_birth: null, gender: '', email: '', mobile_number: '', residential_address: null, emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '' },
  onboarding: { password_change_required: false, profile_status: 'incomplete', documents_status: 'complete', primary_state: 'profile_incomplete', profile_completion_percentage: 20, missing_fields: ['email'], missing_sections: ['contact_information'], missing_documents: [], documents: [] },
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter><StudentOnboardingPage /></MemoryRouter></QueryClientProvider>)
}

describe('student onboarding', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(onboardingService.get).mockResolvedValue(structuredClone(payload)) })

  it('shows a retry action on initial load failure', async () => {
    vi.mocked(onboardingService.get).mockRejectedValueOnce(new Error('Unavailable'))
    mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await screen.findByLabelText('First name')).toHaveValue('Amina')
  })

  it('saves only one section and retains edits in other sections', async () => {
    vi.mocked(onboardingService.updateProfile).mockImplementation(async (data) => ({ ...payload, profile: { ...payload.profile, ...data } }))
    mount()
    fireEvent.change(await screen.findByLabelText('Name', { exact: true }), { target: { value: 'Unsaved guardian' } })
    fireEvent.change(screen.getByLabelText('Email', { exact: true }), { target: { value: 'amina@example.edu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save contact information' }))
    await waitFor(() => expect(onboardingService.updateProfile).toHaveBeenCalledWith({ email: 'amina@example.edu', mobile_number: '' }))
    expect(screen.getByLabelText('Name', { exact: true })).toHaveValue('Unsaved guardian')
    expect(screen.getByLabelText('First name')).toBeDisabled()
    expect(screen.getByRole('link', { name: /finish later/ })).toHaveAttribute('href', '/dashboard/student')
  })
})
