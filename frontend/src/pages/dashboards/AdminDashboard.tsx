import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { dashboardApi, DashboardStats } from '@/api/dashboard'
import api from '@/api/axios'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coursesCount, setCoursesCount] = useState<number>(0)
  const [sectionsCount, setSectionsCount] = useState<number>(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const [statsData, coursesRes, sectionsRes] = await Promise.all([
          dashboardApi.getStats(),
          api.get('/api/academics/courses/').catch(() => ({ data: { count: 0 } })),
          api.get('/api/academics/sections/').catch(() => ({ data: { count: 0 } })),
        ])
        setStats(statsData)
        setCoursesCount(coursesRes.data.count || coursesRes.data.results?.length || 0)
        setSectionsCount(sectionsRes.data.count || sectionsRes.data.results?.length || 0)
        setError(null)
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
                  {stats.total_students ?? 0}
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
                  {coursesCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">{sectionsCount} Sections</Badge>
              <span className="text-xs text-gray-500">active sections</span>
            </div>
          </Card>

          {/* Legacy requests module removed */}

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.published_results ?? 0}
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
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_programs ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                🎓
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_sessions ?? 0}
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
                  {stats.draft_results ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Finance Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.finance_outstanding !== undefined 
                    ? `₹${stats.finance_outstanding.toLocaleString('en-IN')}` 
                    : '₹0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </Card>
        </div>

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
