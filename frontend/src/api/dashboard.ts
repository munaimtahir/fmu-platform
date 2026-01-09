import api from './axios'

/**
 * Represents the structure of the dashboard statistics object.
 * The properties are optional as they vary depending on the user's role.
 */
export interface DashboardStats {
  // Admin/Registrar stats
  total_students?: number
  total_courses?: number
  active_sections?: number
  pending_requests?: number
  published_results?: number
  ineligible_students?: number
  
  // Faculty stats
  my_sections?: number
  my_students?: number
  pending_attendance?: number
  draft_results?: number
  
  // Student stats
  enrolled_courses?: number
  attendance_rate?: number
  completed_results?: number
  
  // Error/message
  error?: string
  message?: string
}

/**
 * Admin dashboard data structure
 */
export interface AdminDashboardData {
  counts: {
    students: number
    faculty: number
    programs: number
    courses: number
  }
  attendance_stats: {
    last_7_days: {
      total_marked: number
      absent_percent: number
      late_percent: number
      missing_entries: number
    }
  }
  recent_activity: Array<{
    id: string
    actor: string
    action: string
    entity: string
    timestamp: string
    summary: string
  }>
  system: {
    app_version: string
    server_time: string
    env_label: string
    django_version: string
  }
}

/**
 * An object containing API methods related to the dashboard.
 */
export const dashboardApi = {
  /**
   * Fetches the dashboard statistics for the currently authenticated user.
   *
   * @returns {Promise<DashboardStats>} A promise that resolves with the dashboard statistics.
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats/')
    return response.data
  },
  /**
   * Fetches the admin dashboard overview data.
   *
   * @returns {Promise<AdminDashboardData>} A promise that resolves with the admin dashboard data.
   */
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    const response = await api.get<AdminDashboardData>('/api/admin/dashboard/')
    return response.data
  },
}
