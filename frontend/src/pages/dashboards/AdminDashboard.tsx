import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { studentsService, programsService, coursesService, sectionsService, sessionsService, resultsService } from '@/services'

/**
 * Admin dashboard statistics derived from list endpoints
 */
interface AdminDashboardStats {
  total_students: number
  total_programs: number
  total_courses: number
  total_sections: number
  total_sessions: number
  published_results: number
  draft_results: number
  unavailable_stats: string[]
}

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminDashboardStats>({
    total_students: 0,
    total_programs: 0,
    total_courses: 0,
    total_sections: 0,
    total_sessions: 0,
    published_results: 0,
    draft_results: 0,
    unavailable_stats: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all counts in parallel using list endpoints with page_size=1 to minimize data transfer
        // We only need the count field from paginated responses
        const [
          studentsRes,
          programsRes,
          coursesRes,
          sectionsRes,
          sessionsRes,
          publishedResultsRes,
          draftResultsRes,
        ] = await Promise.allSettled([
          studentsService.getAll({ page: 1 }),
          programsService.getAll({ page: 1 }),
          coursesService.getAll({ page: 1 }),
          sectionsService.getAll({ page: 1 }),
          sessionsService.getAll({ page: 1 }),
          resultsService.getAll({ page: 1, published: true }),
          resultsService.getAll({ page: 1, published: false }),
        ])

        const unavailable: string[] = []
        const newStats: AdminDashboardStats = {
          total_students: 0,
          total_programs: 0,
          total_courses: 0,
          total_sections: 0,
          total_sessions: 0,
          published_results: 0,
          draft_results: 0,
          unavailable_stats: [],
        }

        // Extract counts from successful responses
        if (studentsRes.status === 'fulfilled') {
          newStats.total_students = studentsRes.value.count ?? studentsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Total Students')
        }

        if (programsRes.status === 'fulfilled') {
          newStats.total_programs = programsRes.value.count ?? programsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Total Programs')
        }

        if (coursesRes.status === 'fulfilled') {
          newStats.total_courses = coursesRes.value.count ?? coursesRes.value.results?.length ?? 0
        } else {
          unavailable.push('Total Courses')
        }

        if (sectionsRes.status === 'fulfilled') {
          newStats.total_sections = sectionsRes.value.count ?? sectionsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Total Sections')
        }

        if (sessionsRes.status === 'fulfilled') {
          newStats.total_sessions = sessionsRes.value.count ?? sessionsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Total Sessions')
        }

        if (publishedResultsRes.status === 'fulfilled') {
          newStats.published_results = publishedResultsRes.value.count ?? publishedResultsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Published Results')
        }

        if (draftResultsRes.status === 'fulfilled') {
          newStats.draft_results = draftResultsRes.value.count ?? draftResultsRes.value.results?.length ?? 0
        } else {
          unavailable.push('Draft Results')
        }

        newStats.unavailable_stats = unavailable
        setStats(newStats)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.full_name || 'Administrator'}. Here's your system overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_students}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="success">Active</Badge>
              <span className="text-xs text-gray-500">students enrolled</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_courses}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">{stats.total_sections} Sections</Badge>
              <span className="text-xs text-gray-500">active sections</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.published_results}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="success">Published</Badge>
              <span className="text-xs text-gray-500">total results</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_programs}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                🎓
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_sessions}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Draft Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.draft_results}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </Card>
        </div>

        {/* Show note if some stats are unavailable */}
        {stats.unavailable_stats.length > 0 && (
          <Card>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Some statistics could not be loaded: {stats.unavailable_stats.join(', ')}. 
                Showing 0 for unavailable metrics.
              </p>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy enrollment and requests modules removed */}
        </div>

        {/* Module Entry Points */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Module Entry Points
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Core (Users & Roles)', icon: '👤', path: '/admin/users' },
              { label: 'Timetable', icon: null, path: '/timetable', useText: true },
              { label: 'People (Identity)', icon: '🆔', path: '/people' },
              { label: 'Academics', icon: '📚', path: '/academics/programs' },
              { label: 'Students', icon: '👥', path: '/students' },
              { label: 'Finance', icon: '💰', path: '/finance' },
              { label: 'Attendance', icon: '✅', path: '/attendance' },
              { label: 'Results', icon: '📈', path: '/results' },
            ].map((module, index) => (
              <Link
                key={index}
                to={module.path}
                className="p-4 border border-gray-200 rounded-2xl hover:border-[#3B82F6] hover:bg-blue-50 transition-all duration-150 text-center cursor-pointer"
              >
                <div className="text-3xl mb-2">
                  {module.useText ? (
                    <span className="text-lg font-semibold text-gray-700">timetable</span>
                  ) : (
                    module.icon
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{module.label}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
