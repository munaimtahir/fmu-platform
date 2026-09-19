/**
 * Student leave periods.
 *
 * Backend endpoint: /api/leave-periods/
 * Tasks: students.leave_periods.view|create|update|delete
 */
import api from '@/api/axios'
import type { Paginated } from '@/lib/pagination'

export type LeaveType = 'medical' | 'personal' | 'academic' | 'absence'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export const LEAVE_TYPE_OPTIONS: Array<{ value: LeaveType; label: string }> = [
  { value: 'medical', label: 'Medical leave' },
  { value: 'personal', label: 'Personal leave' },
  { value: 'academic', label: 'Academic leave' },
  { value: 'absence', label: 'Absence leave' },
]
export const LEAVE_STATUS_OPTIONS: Array<{ value: LeaveStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
]

export interface LeavePeriod {
  id: number
  student: number
  student_reg_no: string
  student_name: string
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  approved_by: number | null
  approved_by_username: string | null
  counts_toward_graduation: boolean
  created_at: string
  updated_at: string
}

export interface LeavePeriodPayload {
  student: number
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
}

export const leavePeriodsService = {
  async list(params?: { student?: number; status?: LeaveStatus; page?: number }): Promise<Paginated<LeavePeriod>> {
    const response = await api.get<Paginated<LeavePeriod>>('/api/leave-periods/', { params })
    return response.data
  },

  async create(payload: LeavePeriodPayload): Promise<LeavePeriod> {
    const response = await api.post<LeavePeriod>('/api/leave-periods/', payload)
    return response.data
  },

  async update(id: number, payload: Partial<LeavePeriodPayload>): Promise<LeavePeriod> {
    const response = await api.patch<LeavePeriod>(`/api/leave-periods/${id}/`, payload)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/leave-periods/${id}/`)
  },
}
