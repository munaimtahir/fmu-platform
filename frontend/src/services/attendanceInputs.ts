/**
 * Attendance input workflows (live, CSV, scanned sheet, biometric)
 */
import api from '@/api/axios'

export interface LiveSubmitPayload {
  session_id: number
  date?: string
  default_status?: string
  records: Array<{ student_id?: number; reg_no?: string; status: string }>
}

export const attendanceInputService = {
  async getRoster(sessionId: number) {
    const response = await api.get('/api/attendance-input/live/roster/', {
      params: { session_id: sessionId },
    })
    return response.data
  },

  async submitLive(payload: LiveSubmitPayload) {
    const response = await api.post('/api/attendance-input/live/submit/', payload)
    return response.data
  },

  async csvDryRun(formData: FormData) {
    const response = await api.post('/api/attendance-input/csv/dry-run/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async csvCommit(jobId: number) {
    const response = await api.post('/api/attendance-input/csv/commit/', { job_id: jobId })
    return response.data
  },

  templateUrl(sessionId: number) {
    return api.getUri({
      url: '/api/attendance-input/sheet/template/',
      params: { session_id: sessionId },
    })
  },

  async sheetDryRun(formData: FormData) {
    const response = await api.post('/api/attendance-input/sheet/dry-run/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async sheetCommit(jobId: number, records?: Array<{ student_id: number; status: string }>) {
    const response = await api.post('/api/attendance-input/sheet/commit/', {
      job_id: jobId,
      records,
    })
    return response.data
  },

  async importPunches(punches: Array<Record<string, unknown>>) {
    const response = await api.post('/api/attendance-input/biometric/punches/', { punches })
    return response.data
  },
}
