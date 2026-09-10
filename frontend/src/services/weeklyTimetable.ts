/**
 * Weekly Timetable API service
 */
import api from '@/api/axios'
import { PaginatedResponse, WeeklyTimetable, TimetableEntry, MobileStudentTimetable } from '@/types'

export const weeklyTimetableService = {
  /**
   * Get all weekly timetables with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    academic_period?: number
    batch?: number
    status?: 'draft' | 'published'
    week_start_date?: string
    ordering?: string
  }): Promise<PaginatedResponse<WeeklyTimetable>> {
    const response = await api.get<PaginatedResponse<WeeklyTimetable>>('/api/timetable/weekly-timetables/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single weekly timetable by ID (includes entries)
   */
  async getById(id: number): Promise<WeeklyTimetable> {
    const response = await api.get<WeeklyTimetable>(`/api/timetable/weekly-timetables/${id}/`)
    return response.data
  },

  /**
   * Create a new weekly timetable
   */
  async create(data: {
    academic_period: number
    batch: number
    week_start_date: string
    status?: 'draft' | 'published'
  }): Promise<WeeklyTimetable> {
    // Remove status if not provided - backend will default to draft
    const response = await api.post<WeeklyTimetable>('/api/timetable/weekly-timetables/', data)
    return response.data
  },

  /**
   * Update an existing weekly timetable
   */
  async update(id: number, data: Partial<Omit<WeeklyTimetable, 'id' | 'created_at' | 'updated_at'>>): Promise<WeeklyTimetable> {
    const response = await api.patch<WeeklyTimetable>(`/api/timetable/weekly-timetables/${id}/`, data)
    return response.data
  },

  /**
   * Delete a weekly timetable
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/timetable/weekly-timetables/${id}/`)
  },

  /**
   * Publish a draft timetable
   */
  async publish(id: number): Promise<WeeklyTimetable> {
    const response = await api.post<WeeklyTimetable>(`/api/timetable/weekly-timetables/${id}/publish/`)
    return response.data
  },

  /**
   * Unpublish a published timetable (admin only)
   */
  async unpublish(id: number): Promise<WeeklyTimetable> {
    const response = await api.post<WeeklyTimetable>(`/api/timetable/weekly-timetables/${id}/unpublish/`)
    return response.data
  },

  /**
   * Generate weekly timetable templates for all weeks in an academic period
   */
  async generateWeeklyTemplates(batchId: number, academicPeriodId: number): Promise<{
    detail: string
    created_count: number
    existing_count: number
    total_weeks: number
    created_ids: number[]
  }> {
    const response = await api.post<{
      detail: string
      created_count: number
      existing_count: number
      total_weeks: number
      created_ids: number[]
    }>('/api/timetable/weekly-timetables/generate_weekly_templates/', {
      batch: batchId,
      academic_period: academicPeriodId,
    })
    return response.data
  },
}

export const timetableEntryService = {
  async getAll(params?: {
    weekly_timetable?: number
    section?: number
    group?: number
    day_of_week?: number
    status?: string
    ordering?: string
  }): Promise<TimetableEntry[]> {
    const response = await api.get('/api/timetable/entries/', { params })
    if (Array.isArray(response.data)) {
      return response.data
    }
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return (response.data as PaginatedResponse<TimetableEntry>).results
    }
    return []
  },

  async create(data: {
    weekly_timetable: number
    section: number
    group?: number | null
    day_of_week: number
    start_time: string
    end_time: string
    room?: string
    notes?: string
  }): Promise<TimetableEntry> {
    const response = await api.post<TimetableEntry>('/api/timetable/entries/', data)
    return response.data
  },

  async update(id: number, data: Partial<Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<TimetableEntry> {
    const response = await api.patch<TimetableEntry>(`/api/timetable/entries/${id}/`, data)
    return response.data
  },

  async cancel(id: number): Promise<TimetableEntry> {
    const response = await api.post<TimetableEntry>(`/api/timetable/entries/${id}/cancel/`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/timetable/entries/${id}/`)
  },
}

export const mobileTimetableService = {
  /**
   * Student-scoped read-only weekly schedule. `weekStartDate` may be any
   * date within the target week (any ISO date string); omit for the
   * current week.
   */
  async getMyWeek(weekStartDate?: string): Promise<MobileStudentTimetable> {
    const response = await api.get<MobileStudentTimetable>('/api/mobile/student/timetable/', {
      params: weekStartDate ? { week_start_date: weekStartDate } : undefined,
    })
    return response.data
  },
}
