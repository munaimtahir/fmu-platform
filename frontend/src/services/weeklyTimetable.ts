/**
 * Weekly Timetable API service
 */
import api from '@/api/axios'
import { PaginatedResponse, WeeklyTimetable, TimetableCell } from '@/types'

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
   * Get a single weekly timetable by ID (includes cells)
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
  async update(id: number, data: Partial<Omit<WeeklyTimetable, 'id' | 'cells' | 'created_at' | 'updated_at'>>): Promise<WeeklyTimetable> {
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

export const timetableCellService = {
  /**
   * Get all timetable cells with optional filters
   */
  async getAll(params?: {
    weekly_timetable?: number
    day_of_week?: number
    time_slot?: string
  }): Promise<TimetableCell[]> {
    const response = await api.get('/api/timetable/timetable-cells/', {
      params,
    })
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return response.data
    }
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return (response.data as PaginatedResponse<TimetableCell>).results
    }
    return []
  },

  /**
   * Get a single timetable cell by ID
   */
  async getById(id: number): Promise<TimetableCell> {
    const response = await api.get<TimetableCell>(`/api/timetable/timetable-cells/${id}/`)
    return response.data
  },

  /**
   * Create a new timetable cell
   */
  async create(data: Omit<TimetableCell, 'id' | 'created_at' | 'updated_at' | 'day_of_week_display'>): Promise<TimetableCell> {
    const response = await api.post<TimetableCell>('/api/timetable/timetable-cells/', data)
    return response.data
  },

  /**
   * Update an existing timetable cell
   */
  async update(id: number, data: Partial<Omit<TimetableCell, 'id' | 'created_at' | 'updated_at' | 'day_of_week_display'>>): Promise<TimetableCell> {
    const response = await api.patch<TimetableCell>(`/api/timetable/timetable-cells/${id}/`, data)
    return response.data
  },

  /**
   * Delete a timetable cell
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/timetable/timetable-cells/${id}/`)
  },

  /**
   * Bulk update/create cells for a timetable
   */
  async bulkUpdate(timetableId: number, cells: Array<{
    id?: number
    day_of_week: number
    time_slot: string
    line1: string
    line2: string
    line3: string
  }>): Promise<TimetableCell[]> {
    // First, get existing cells for this timetable
    const existingCells = await this.getAll({ weekly_timetable: timetableId })
    
    // Create a map of existing cells by day+time
    const existingMap = new Map<string, TimetableCell>()
    existingCells.forEach(cell => {
      const key = `${cell.day_of_week}-${cell.time_slot}`
      existingMap.set(key, cell)
    })

    // Create a set of keys from all new cells
    const newKeys = new Set(cells.map(c => `${c.day_of_week}-${c.time_slot}`))

    // Update existing cells or create new ones (process all cells, even empty ones)
    const results: TimetableCell[] = []
    for (const cellData of cells) {
      const key = `${cellData.day_of_week}-${cellData.time_slot}`
      const existing = existingMap.get(key)
      
      const cellPayload = {
        day_of_week: cellData.day_of_week,
        time_slot: cellData.time_slot,
        line1: cellData.line1 || '',
        line2: cellData.line2 || '',
        line3: cellData.line3 || '',
        weekly_timetable: timetableId,
      }

      if (existing) {
        // Update existing cell if data changed
        if (
          (existing.line1 || '') !== cellPayload.line1 ||
          (existing.line2 || '') !== cellPayload.line2 ||
          (existing.line3 || '') !== cellPayload.line3
        ) {
          const updated = await this.update(existing.id, cellPayload)
          results.push(updated)
        } else {
          results.push(existing)
        }
      } else {
        // Create new cell (even if empty - needed for validation)
        const created = await this.create(cellPayload)
        results.push(created)
      }
    }

    // Delete cells that are no longer in the new cells list (shouldn't happen if frontend sends all 60)
    for (const existing of existingCells) {
      const key = `${existing.day_of_week}-${existing.time_slot}`
      if (!newKeys.has(key)) {
        await this.delete(existing.id)
      }
    }

    return results
  },
}
