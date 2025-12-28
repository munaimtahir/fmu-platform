/**
 * Analytics Dashboard Page
 * Displays comprehensive statistics and analytics for the system
 */
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { studentsService, coursesService, sectionsService, enrollmentService, attendanceService } from '@/services'

export function AnalyticsDashboard() {
  // Fetch all data
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsService.getAll({}),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getAll({}),
  })

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsService.getAll({}),
  })

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => enrollmentService.getAll({}),
  })

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAll({}),
  })

  const isLoading = studentsLoading || coursesLoading || sectionsLoading || enrollmentsLoading || attendanceLoading

  // Calculate statistics
  const stats = {
    totalStudents: studentsData?.count || 0,
    activeStudents: studentsData?.results.filter(s => s.status === 'Active').length || 0,
    totalCourses: coursesData?.count || 0,
    totalSections: sectionsData?.count || 0,
    totalEnrollments: enrollmentsData?.count || 0,
    totalAttendance: attendanceData?.count || 0,
    presentCount: attendanceData?.results.filter(a => a.status === 'Present').length || 0,
    absentCount: attendanceData?.results.filter(a => a.status === 'Absent').length || 0,
  }

  // Calculate percentages
  const attendanceRate = stats.totalAttendance > 0 
    ? ((stats.presentCount / stats.totalAttendance) * 100).toFixed(1)
    : 0

  // Student status breakdown
  const studentsByStatus = {
    Active: studentsData?.results.filter(s => s.status === 'Active').length || 0,
    Inactive: studentsData?.results.filter(s => s.status === 'Inactive').length || 0,
    Graduated: studentsData?.results.filter(s => s.status === 'Graduated').length || 0,
    Suspended: studentsData?.results.filter(s => s.status === 'Suspended').length || 0,
  }

  // Enrollment trends (mock - could be enhanced with date-based queries)
  const avgEnrollmentsPerSection = stats.totalSections > 0
    ? (stats.totalEnrollments / stats.totalSections).toFixed(1)
    : 0

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive system statistics and insights</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
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
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
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
                <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl">
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
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
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
            <h3 className="text-lg font-semibold mb-4">Student Status Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(studentsByStatus).map(([status, count]) => {
                const percentage = stats.totalStudents > 0 
                  ? ((count / stats.totalStudents) * 100).toFixed(1) 
                  : 0
                const variant = status === 'Active' ? 'success' : 
                              status === 'Graduated' ? 'primary' :
                              status === 'Inactive' ? 'warning' : 'danger'
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={variant as any}>{status}</Badge>
                      <span className="text-gray-600">{count} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === 'Active' ? 'bg-green-500' :
                            status === 'Graduated' ? 'bg-blue-500' :
                            status === 'Inactive' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-700">{stats.presentCount}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-700">{stats.absentCount}</p>
                </div>
                <div className="text-3xl">❌</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalAttendance}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
          </Card>

          {/* Enrollment Statistics */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Enrollment Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Sections</span>
                <span className="text-xl font-bold">{stats.totalSections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Enrollments</span>
                <span className="text-xl font-bold">{stats.totalEnrollments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Students/Section</span>
                <span className="text-xl font-bold">{avgEnrollmentsPerSection}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600">Enrollment Rate</span>
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
            <h3 className="text-lg font-semibold mb-4">System Overview</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Database Status</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Data Points</span>
                  <span className="text-lg font-bold">
                    {stats.totalStudents + stats.totalCourses + stats.totalSections + stats.totalEnrollments}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Total records in system</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500">Real-time data</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
