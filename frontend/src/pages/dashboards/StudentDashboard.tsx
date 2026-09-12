import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/features/auth/useAuth'
import { dashboardApi } from '@/api/dashboard'

interface StudentDashboardStats {
  student_name?: string
  reg_no?: string
  program?: string
  batch?: string
  attendance_percentage?: number
  classes_attended?: number
  pending_dues?: number
  published_results?: number
  message?: string
  note?: string
}

export const StudentDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<StudentDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await dashboardApi.getStats()
        setStats(data as StudentDashboardStats)
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard data')
        console.error('Error fetching student dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
              Student Dashboard
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
            Student Dashboard
          </h1>
          <p className="text-ink-secondary">
            Welcome back, {stats?.student_name || user?.full_name || 'Student'}. Here's your academic overview.
          </p>
          {stats?.reg_no && (
            <p className="text-sm text-ink-muted mt-1">
              Registration Number: {stats.reg_no} | {stats.program} - {stats.batch}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Attendance Rate</p>
                <p className="text-h2 text-ink-primary">
                  {stats?.attendance_percentage !== undefined 
                    ? `${stats.attendance_percentage}%` 
                    : 'N/A'}
                </p>
                {stats?.classes_attended !== undefined && (
                  <p className="text-xs text-ink-muted mt-1">
                    {stats.classes_attended} classes attended
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-success-subtle rounded-2xl flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Published Results</p>
                <p className="text-h2 text-ink-primary">
                  {stats?.published_results ?? 0}
                </p>
                <p className="text-xs text-ink-muted mt-1">Available results</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Pending Dues</p>
                <p className="text-h2 text-ink-primary">
                  {stats?.pending_dues ?? 0}
                </p>
                <p className="text-xs text-ink-muted mt-1">Outstanding vouchers</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Program</p>
                <p className="text-h4 text-ink-primary truncate">
                  {stats?.program || 'N/A'}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {stats?.batch || ''}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                🎓
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/transcripts'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                📖
              </div>
              <div>
                <h3 className="font-semibold text-ink-primary">Transcripts</h3>
                <p className="text-sm text-ink-secondary">Generate and verify academic transcripts</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/results'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success-subtle rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h3 className="font-semibold text-ink-primary">View Results</h3>
                <p className="text-sm text-ink-secondary">See published exam results</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/finance/me'}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning-subtle rounded-xl flex items-center justify-center text-2xl">
                💳
              </div>
              <div>
                <h3 className="font-semibold text-ink-primary">Finance</h3>
                <p className="text-sm text-ink-secondary">View fees and payments</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    
  )
}
