import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { dashboardApi, DashboardStats } from '@/api/dashboard'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await dashboardApi.getStats()
        setStats(data)
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
                <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_courses ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">{stats.active_sections ?? 0} Sections</Badge>
              <span className="text-xs text-gray-500">this semester</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending_requests ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="warning">Needs Review</Badge>
              <span className="text-xs text-gray-500">document requests</span>
            </div>
          </Card>

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

        {/* Additional Stats */}
        {stats.ineligible_students !== undefined && stats.ineligible_students > 0 && (
          <Card>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-semibold text-red-900">Attendance Alert</p>
                <p className="text-sm text-red-700">
                  {stats.ineligible_students} student{stats.ineligible_students !== 1 ? 's' : ''} below 75% attendance
                </p>
              </div>
              <Badge variant="danger">{stats.ineligible_students}</Badge>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Enrollments
            </h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Enrollment data will be displayed here
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Actions
            </h2>
            <div className="space-y-3">
              {stats.pending_requests !== undefined && stats.pending_requests > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <p className="text-sm font-medium text-gray-900">Review Document Requests</p>
                  </div>
                  <Badge variant="primary">{stats.pending_requests}</Badge>
                </div>
              )}
              {(!stats.pending_requests || stats.pending_requests === 0) && (
                <p className="text-sm text-gray-500">No pending actions</p>
              )}
            </div>
          </Card>
        </div>

        {/* Module Entry Points */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Module Entry Points
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Core (Users & Roles)', icon: '👤', path: '/admin/users' },
              { label: 'Audit Logs', icon: '📋', path: '/admin/audit' },
              { label: 'People (Identity)', icon: '🆔', path: '/people' },
              { label: 'Academics', icon: '📚', path: '/academics/programs' },
              { label: 'Students', icon: '👥', path: '/students' },
              { label: 'Requests', icon: '📝', path: '/requests' },
              { label: 'Enrollment', icon: '📅', path: '/enrollment/bulk' },
              { label: 'Finance', icon: '💰', path: '/finance' },
              { label: 'Attendance', icon: '✅', path: '/attendance' },
              { label: 'Assessments', icon: '📊', path: '/assessments' },
              { label: 'Results', icon: '📈', path: '/results' },
              { label: 'Documents', icon: '📄', path: '/documents' },
              { label: 'Notifications', icon: '🔔', path: '/notifications' },
            ].map((module, index) => (
              <a
                key={index}
                href={module.path}
                className="p-4 border border-gray-200 rounded-2xl hover:border-[#3B82F6] hover:bg-blue-50 transition-all duration-150 text-center cursor-pointer"
              >
                <div className="text-3xl mb-2">{module.icon}</div>
                <p className="text-sm font-medium text-gray-900">{module.label}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
