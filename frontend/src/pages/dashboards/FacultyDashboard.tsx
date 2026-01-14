import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/features/auth/useAuth'
import { dashboardApi, DashboardStats } from '@/api/dashboard'
import { sectionsService } from '@/services/sections'
import { Section } from '@/types'

export const FacultyDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({})
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [statsData, sectionsData] = await Promise.all([
          dashboardApi.getStats(),
          sectionsService.getAll().catch(() => ({ results: [], count: 0 })),
        ])
        setStats(statsData)
        setSections(Array.isArray(sectionsData.results) ? sectionsData.results : [])
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard data')
        console.error('Error fetching faculty dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || stats?.message) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Faculty Dashboard
            </h1>
          </div>
          <Alert variant="error">
            {error || stats?.message || 'Unable to load dashboard data'}
            {stats?.note && (
              <div className="mt-2 text-sm">{stats.note}</div>
            )}
          </Alert>
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
            Faculty Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {user?.full_name || 'Professor'}. Manage your courses and students.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.my_sessions ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">{sections.length} Sections</Badge>
              <span className="text-xs text-gray-500">assigned</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.my_students ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="success">Active</Badge>
              <span className="text-xs text-gray-500">across all sections</span>
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
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="warning">Pending</Badge>
              <span className="text-xs text-gray-500">awaiting review</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Sections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sections.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">Active</Badge>
              <span className="text-xs text-gray-500">this period</span>
            </div>
          </Card>
        </div>

        {/* My Sections */}
        {sections.length > 0 ? (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Sections
            </h2>
            <div className="space-y-3">
              {sections.map((section: any) => (
                <div key={section.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {section.course_code || 'N/A'} - {section.course_name || section.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Section {section.name} • {section.academic_period_name || 'N/A'}
                      {section.group_name && ` • ${section.group_name}`}
                      {section.enrolled_count !== undefined && ` • ${section.enrolled_count} enrolled`}
                    </p>
                  </div>
                  <Link
                    to={`/sections/${section.id}`}
                    className="px-3 py-1 text-sm text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors duration-150"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500">No sections assigned yet.</p>
              <p className="text-sm text-gray-400 mt-2">Contact the administrator to get assigned to sections.</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/attendance'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Attendance</h3>
                <p className="text-sm text-gray-600">Mark and view attendance</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/gradebook'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                📖
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gradebook</h3>
                <p className="text-sm text-gray-600">Manage grades and assessments</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/results'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Results</h3>
                <p className="text-sm text-gray-600">View and manage results</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
