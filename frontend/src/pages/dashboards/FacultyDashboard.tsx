import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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

  const {
    data: stats = {} as DashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
  })

  const {
    data: sectionsData,
    isLoading: sectionsLoading,
    isError: sectionsIsError,
  } = useQuery({
    queryKey: ['sections', 'mine'],
    queryFn: () => sectionsService.getAll(),
  })

  const sections: Section[] = sectionsIsError
    ? []
    : Array.isArray(sectionsData?.results)
      ? sectionsData.results
      : []

  const loading = statsLoading || sectionsLoading
  const error = statsError
    ? (statsError as any)?.response?.data?.error || (statsError as any)?.message || 'Failed to load dashboard data'
    : null

  if (loading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      
    )
  }

  if (error || stats?.message) {
    return (
      
        <div className="space-y-6">
          <div>
            <h1 className="text-h1 text-ink-primary mb-2">
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
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-ink-primary mb-2">
            Faculty Dashboard
          </h1>
          <p className="text-ink-secondary">
            Welcome, {user?.full_name || 'Professor'}. Manage your courses and students.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">My Sessions</p>
                <p className="text-h2 text-ink-primary">
                  {stats.my_sessions ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">{sections.length} Sections</Badge>
              <span className="text-xs text-ink-muted">assigned</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Total Students</p>
                <p className="text-h2 text-ink-primary">
                  {stats.my_students ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-subtle rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="success">Active</Badge>
              <span className="text-xs text-ink-muted">across all sections</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Draft Results</p>
                <p className="text-h2 text-ink-primary">
                  {stats.draft_results ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-subtle rounded-lg flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="warning">Pending</Badge>
              <span className="text-xs text-ink-muted">awaiting review</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">My Sections</p>
                <p className="text-h2 text-ink-primary">
                  {sections.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="primary">Active</Badge>
              <span className="text-xs text-ink-muted">this period</span>
            </div>
          </Card>
        </div>

        {/* My Sections */}
        {sections.length > 0 ? (
          <Card>
            <h2 className="text-h3 text-ink-primary mb-4">
              My Sections
            </h2>
            <div className="space-y-3">
              {sections.map((section: any) => (
                <div key={section.id} className="flex items-center justify-between py-3 border-b border-neutral-subtle last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-primary">
                      {section.course_code || 'N/A'} - {section.course_name || section.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Section {section.name} • {section.academic_period_name || 'N/A'}
                      {section.group_name && ` • ${section.group_name}`}
                      {section.enrolled_count !== undefined && ` • ${section.enrolled_count} enrolled`}
                    </p>
                  </div>
                  <Link
                    to={`/sections/${section.id}`}
                    className="px-3 py-1 text-sm text-primary hover:bg-blue-50 rounded-lg transition-colors duration-150"
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
              <p className="text-ink-muted">No sections assigned yet.</p>
              <p className="text-sm text-ink-muted mt-2">Contact the administrator to get assigned to sections.</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/attendance" className="block">
            <Card className="hover:shadow-elevation-3 transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success-subtle rounded-xl flex items-center justify-center text-2xl">
                  ✅
                </div>
                <div>
                  <h3 className="font-semibold text-ink-primary">Attendance</h3>
                  <p className="text-sm text-ink-secondary">Mark and view attendance</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/exams" className="block">
            <Card className="hover:shadow-elevation-3 transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  📖
                </div>
                <div>
                  <h3 className="font-semibold text-ink-primary">Exams</h3>
                  <p className="text-sm text-ink-secondary">Manage canonical exams and results</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/results" className="block">
            <Card className="hover:shadow-elevation-3 transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success-subtle rounded-xl flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold text-ink-primary">Results</h3>
                  <p className="text-sm text-ink-secondary">View and manage results</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    
  )
}
