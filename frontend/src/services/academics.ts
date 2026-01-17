/**
 * Academics API service (Academic Periods, Groups, Departments)
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

export interface AcademicPeriod {
  id: number
  name: string
  period_type: string
  parent_period?: number | null
  parent_period_name?: string
  start_date?: string | null
  end_date?: string | null
}

export interface Group {
  id: number
  name: string
  batch: number
  batch_name?: string
}

export interface Department {
  id: number
  name: string
  code?: string
}

// Faculty user type for academics service (simplified, not the full auth User)
export interface FacultyUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name?: string
}

export interface CreateAcademicPeriodData {
  period_type: string
  name: string
  parent_period?: number | null
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateAcademicPeriodData extends Partial<CreateAcademicPeriodData> {}

export interface CreateGroupData {
  name: string
  batch: number
}

export interface UpdateGroupData extends Partial<CreateGroupData> {}

export const academicsService = {
  /**
   * Get all academic periods
   */
  async getAcademicPeriods(): Promise<AcademicPeriod[]> {
    const response = await api.get<PaginatedResponse<AcademicPeriod>>('/api/academics/academic-periods/')
    return response.data.results || response.data
  },

  /**
   * Get academic period by ID
   */
  async getAcademicPeriod(id: number): Promise<AcademicPeriod> {
    const response = await api.get<AcademicPeriod>(`/api/academics/academic-periods/${id}/`)
    return response.data
  },

  /**
   * Create academic period
   */
  async createAcademicPeriod(data: CreateAcademicPeriodData): Promise<AcademicPeriod> {
    const response = await api.post<AcademicPeriod>('/api/academics/academic-periods/', data)
    return response.data
  },

  /**
   * Update academic period
   */
  async updateAcademicPeriod(id: number, data: UpdateAcademicPeriodData): Promise<AcademicPeriod> {
    const response = await api.patch<AcademicPeriod>(`/api/academics/academic-periods/${id}/`, data)
    return response.data
  },

  /**
   * Delete academic period
   */
  async deleteAcademicPeriod(id: number): Promise<void> {
    await api.delete(`/api/academics/academic-periods/${id}/`)
  },

  /**
   * Get all groups
   */
  async getGroups(params?: { batch?: number }): Promise<Group[]> {
    const response = await api.get<PaginatedResponse<Group>>('/api/academics/groups/', { params })
    return response.data.results || response.data
  },

  /**
   * Get group by ID
   */
  async getGroup(id: number): Promise<Group> {
    const response = await api.get<Group>(`/api/academics/groups/${id}/`)
    return response.data
  },

  /**
   * Create group
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await api.post<Group>('/api/academics/groups/', data)
    return response.data
  },

  /**
   * Update group
   */
  async updateGroup(id: number, data: UpdateGroupData): Promise<Group> {
    const response = await api.patch<Group>(`/api/academics/groups/${id}/`, data)
    return response.data
  },

  /**
   * Delete group
   */
  async deleteGroup(id: number): Promise<void> {
    await api.delete(`/api/academics/groups/${id}/`)
  },

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    const response = await api.get<PaginatedResponse<Department>>('/api/academics/departments/')
    return response.data.results || response.data
  },

  /**
   * Get faculty users (users in Faculty group)
   * Note: Since there's no dedicated users API, we'll fetch from existing sessions
   * to get faculty IDs, or allow manual entry. For now, return empty array.
   * In production, create a dedicated /api/users/ endpoint filtered by group.
   */
  async getFacultyUsers(): Promise<FacultyUser[]> {
    try {
      // Try to get users with Faculty group from a potential users endpoint
      // If it doesn't exist, we'll handle it in the form
      const response = await api.get<PaginatedResponse<FacultyUser>>('/api/users/', {
        params: { groups: 'Faculty' },
      })
      return response.data.results || response.data
    } catch (error) {
      // Fallback: Try to get faculty from existing sessions
      try {
        const sessionsResponse = await api.get<PaginatedResponse<any>>('/api/timetable/sessions/', {
          params: { page_size: 1000 },
        })
        const sessions = sessionsResponse.data.results || []
        const facultyMap = new Map<number, FacultyUser>()
        
        sessions.forEach((session: any) => {
          if (session.faculty && !facultyMap.has(session.faculty)) {
            facultyMap.set(session.faculty, {
              id: session.faculty,
              username: session.faculty_name || `Faculty ${session.faculty}`,
              email: '',
              first_name: session.faculty_name?.split(' ')[0] || '',
              last_name: session.faculty_name?.split(' ').slice(1).join(' ') || '',
              full_name: session.faculty_name,
            })
          }
        })
        
        return Array.from(facultyMap.values())
      } catch (fallbackError) {
        console.warn('Could not fetch faculty users:', fallbackError)
        return []
      }
    }
  },
}
