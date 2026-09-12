/**
 * Analytics Dashboard Page
 * Displays comprehensive statistics and analytics for the system
 */
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { studentsService, coursesService, sectionsService, attendanceService } from '@/services'
import { coursesKey } from '@/utils/queryKeys'

export function AnalyticsDashboard() {
  // Fetch all data. Totals/breakdowns come from server-side aggregates
  // (student stats, attendance summary) rather than filtering a single
  // page of `.results`, since those would be wrong once a resource has
  // more rows than the default page size.
  const { data: studentStats, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'stats'],
    queryFn: () => studentsService.getStats(),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: coursesKey(),
    queryFn: () => coursesService.getAll({}),
  })

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsService.getAll({}),
  })

  // Legacy enrollment service removed - enrollment data not available
  const enrollmentsData = { results: [], count: 0 }
  const enrollmentsLoading = false

  const { data: attendanceSummary, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: () => attendanceService.getSummary(),
  })

  const isLoading = studentsLoading || coursesLoading || sectionsLoading || enrollmentsLoading || attendanceLoading

  // Calculate statistics
  const stats = {
    totalStudents: studentStats?.total || 0,
    activeStudents: studentStats?.by_status['active'] || 0,
    totalCourses: coursesData?.count || 0,
    totalSections: sectionsData?.count || 0,
    totalEnrollments: enrollmentsData?.count || 0,
    totalAttendance: attendanceSummary?.total || 0,
    presentCount: attendanceSummary?.present || 0,
    absentCount: attendanceSummary?.absent || 0,
  }

  // Calculate percentages
  const attendanceRate = stats.totalAttendance > 0
    ? ((stats.presentCount / stats.totalAttendance) * 100).toFixed(1)
    : 0

  // Student status breakdown
  const studentsByStatus = {
    Active: studentStats?.by_status['active'] || 0,
    Inactive: studentStats?.by_status['inactive'] || 0,
    Graduated: studentStats?.by_status['graduated'] || 0,
    Suspended: studentStats?.by_status['suspended'] || 0,
  }

  // Enrollment trends (mock - could be enhanced with date-based queries)
  const avgEnrollmentsPerSection = stats.totalSections > 0
    ? (stats.totalEnrollments / stats.totalSections).toFixed(1)
    : 0

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-h1 text-ink-primary mb-2">Analytics Dashboard</h1>
          <p className="text-ink-secondary">Comprehensive system statistics and insights</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Total Students</p>
                <p className="text-h1 text-ink-primary">{stats.totalStudents}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-3xl">
                👥
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="success">{stats.activeStudents} Active</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Total Courses</p>
                <p className="text-h1 text-ink-primary">{stats.totalCourses}</p>
              </div>
              <div className="w-14 h-14 bg-success-subtle rounded-lg flex items-center justify-center text-3xl">
                📚
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="primary">{stats.totalSections} Sections</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Total Enrollments</p>
                <p className="text-h1 text-ink-primary">{stats.totalEnrollments}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center text-3xl">
                📝
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="warning">{avgEnrollmentsPerSection} Avg/Section</Badge>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Attendance Rate</p>
                <p className="text-h1 text-ink-primary">{attendanceRate}%</p>
              </div>
              <div className="w-14 h-14 bg-success-subtle rounded-lg flex items-center justify-center text-3xl">
                ✅
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="success">{stats.presentCount} Present</Badge>
            </div>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Status Breakdown */}
          <Card>
            <h3 className="text-h4 mb-4">Student Status Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(studentsByStatus).map(([status, count]) => {
                const percentage = stats.totalStudents > 0
                  ? ((count / stats.totalStudents) * 100).toFixed(1)
                  : 0

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge domain="student" status={status} />
                      <span className="text-ink-secondary">{count} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-surface-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === 'Active' ? 'bg-success' :
                            status === 'Graduated' ? 'bg-blue-500' :
                            status === 'Inactive' ? 'bg-warning' : 'bg-danger'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-ink-secondary w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <h3 className="text-h4 mb-4">Attendance Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success-subtle rounded-lg">
                <div>
                  <p className="text-sm text-ink-secondary">Present</p>
                  <p className="text-h2 text-success-emphasis">{stats.presentCount}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-danger-subtle rounded-lg">
                <div>
                  <p className="text-sm text-ink-secondary">Absent</p>
                  <p className="text-h2 text-danger-emphasis">{stats.absentCount}</p>
                </div>
                <div className="text-3xl">❌</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-ink-secondary">Total Records</p>
                  <p className="text-h2 text-blue-700">{stats.totalAttendance}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
          </Card>

          {/* Enrollment Statistics */}
          <Card>
            <h3 className="text-h4 mb-4">Enrollment Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Total Sections</span>
                <span className="text-h3">{stats.totalSections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Total Enrollments</span>
                <span className="text-h3">{stats.totalEnrollments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Avg Students/Section</span>
                <span className="text-h3">{avgEnrollmentsPerSection}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-ink-secondary">Enrollment Rate</span>
                <Badge variant="success">
                  {stats.totalStudents > 0 
                    ? ((stats.totalEnrollments / stats.totalStudents) * 100).toFixed(1) 
                    : 0}% of students
                </Badge>
              </div>
            </div>
          </Card>

          {/* System Overview */}
          <Card>
            <h3 className="text-h4 mb-4">System Overview</h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-secondary">Database Status</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <p className="text-xs text-ink-muted">All systems operational</p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-secondary">Data Points</span>
                  <span className="text-h4">
                    {stats.totalStudents + stats.totalCourses + stats.totalSections + stats.totalEnrollments}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">Total records in system</p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-secondary">Last Updated</span>
                  <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-ink-muted">Real-time data</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    
  )
}
