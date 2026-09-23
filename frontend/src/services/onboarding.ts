import api from '@/api/axios'

export interface MissingDocument {
  requirement_id: number
  title: string
}

export interface OnboardingStatus {
  password_change_required: boolean
  profile_status: 'incomplete' | 'complete'
  documents_status: 'pending' | 'complete'
  primary_state: 'password_change_required' | 'profile_incomplete' | 'documents_pending' | 'complete'
  profile_completion_percentage: number
  missing_fields: string[]
  missing_sections: string[]
  missing_documents: MissingDocument[]
  documents: OnboardingDocument[]
}

export interface OnboardingDocument {
  requirement_id: number
  title: string
  description: string
  status: 'pending' | 'submitted' | 'verified' | 'rejected'
  notes: string
  is_active: boolean
  submissions: Array<{ id: number; has_file: boolean; file_name: string; created_at: string }>
}

export interface OnboardingProfile {
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string | null
  gender: string
  email: string
  mobile_number: string
  residential_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
}

export interface OnboardingPayload {
  student: { id: number; reg_no: string; program_name: string; batch_name: string; group_name?: string }
  profile: OnboardingProfile
  onboarding: OnboardingStatus
}

export const onboardingService = {
  async get(): Promise<OnboardingPayload> {
    const response = await api.get<OnboardingPayload>('/api/students/me/onboarding/')
    return response.data
  },
  async updateProfile(data: Partial<OnboardingProfile>): Promise<OnboardingPayload> {
    const response = await api.patch<OnboardingPayload>('/api/students/me/onboarding/profile/', data)
    return response.data
  },
  async submitDocument(requirementId: number, file: File): Promise<OnboardingPayload> {
    const body = new FormData()
    body.append('file', file)
    const response = await api.post<OnboardingPayload>(
      `/api/students/me/onboarding/documents/${requirementId}/submit/`,
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },
  documentDownloadPath(requirementId: number, submissionId: number): string {
    return `/api/compliance/my-compliance/${requirementId}/submissions/${submissionId}/download/`
  },
}
