import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { useAuth } from '@/features/auth/useAuth'
import { studentsService, programsService, coursesService, sectionsService, sessionsService, resultsService } from '@/services'
import { dashboardApi, AdminDashboardData } from '@/api/dashboard'

const getCount = (res: { count?: number; results?: unknown[] } | undefined): number =>
  res?.count ?? res?.results?.length ?? 0

type RecentActivityItem = AdminDashboardData['recent_activity'][number]

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return timestamp
  }
}

const recentActivityColumns: ColumnDef<RecentActivityItem>[] = [
  {
    id: 'timestamp',
    header: 'Time',
    accessorFn: (item) => item.timestamp,
    cell: ({ row }) => formatTimestamp(row.original.timestamp),
  },
  {
    accessorKey: 'actor',
    header: 'Actor',
  },
  {
    accessorKey: 'action',
    header: 'Action',
  },
  {
    accessorKey: 'entity',
    header: 'Entity',
  },
  {
    accessorKey: 'summary',
    header: 'Summary',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 truncate max-w-xs">
        {row.original.summary}
      </span>
    ),
  },
]

export const AdminDashboard = () => {
  const { user } = useAuth()

  // Fetch all counts in parallel using list endpoints with page_size=1 to minimize data transfer
  // We only need the count field from paginated responses
  const [
    studentsQuery,
    programsQuery,
    coursesQuery,
    sectionsQuery,
    sessionsQuery,
    publishedResultsQuery,
    draftResultsQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ['students', 'count'],
        queryFn: () => studentsService.getAll({ page: 1 }),
      },
      {
        queryKey: ['programs', 'count'],
        queryFn: () => programsService.getAll({ page: 1 }),
      },
      {
        queryKey: ['courses', 'count'],
        queryFn: () => coursesService.getAll({ page: 1 }),
      },
      {
        queryKey: ['sections', 'count'],
        queryFn: () => sectionsService.getAll({ page: 1 }),
      },
      {
        queryKey: ['sessions', 'count'],
        queryFn: () => sessionsService.getAll({ page: 1 }),
      },
      {
        queryKey: ['results', 'count', 'PUBLISHED'],
        queryFn: () => resultsService.getAll({ page: 1, status: 'PUBLISHED' }),
      },
      {
        queryKey: ['results', 'count', 'DRAFT'],
        queryFn: () => resultsService.getAll({ page: 1, status: 'DRAFT' }),
      },
    ],
  })

  const {
    data: adminDashboard,
    isLoading: adminDashboardLoading,
    isError: adminDashboardError,
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardApi.getAdminDashboard,
  })

  const loading = [
    studentsQuery,
    programsQuery,
    coursesQuery,
    sectionsQuery,
    sessionsQuery,
    publishedResultsQuery,
    draftResultsQuery,
  ].some((q) => q.isLoading)

  const stats = {
    total_students: studentsQuery.isError ? 0 : getCount(studentsQuery.data),
    total_programs: programsQuery.isError ? 0 : getCount(programsQuery.data),
    total_courses: coursesQuery.isError ? 0 : getCount(coursesQuery.data),
    total_sections: sectionsQuery.isError ? 0 : getCount(sectionsQuery.data),
    total_sessions: sessionsQuery.isError ? 0 : getCount(sessionsQuery.data),
    published_results: publishedResultsQuery.isError ? 0 : getCount(publishedResultsQuery.data),
    draft_results: draftResultsQuery.isError ? 0 : getCount(draftResultsQuery.data),
  }

  const unavailable_stats: string[] = [
    studentsQuery.isError && 'Total Students',
    programsQuery.isError && 'Total Programs',
    coursesQuery.isError && 'Total Courses',
    sectionsQuery.isError && 'Total Sections',
    sessionsQuery.isError && 'Total Sessions',
    publishedResultsQuery.isError && 'Published Results',
    draftResultsQuery.isError && 'Draft Results',
  ].filter((v): v is string => Boolean(v))

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading dashboard...</p>
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

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Faculty</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adminDashboardError ? 0 : adminDashboard?.counts.faculty ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
                👨‍🏫
              </div>
            </div>
          </Card>
        </div>

        {/* Show note if some stats are unavailable */}
        {unavailable_stats.length > 0 && (
          <Card>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Some statistics could not be loaded: {unavailable_stats.join(', ')}.
                Showing 0 for unavailable metrics.
              </p>
            </div>
          </Card>
        )}

        {adminDashboardError && (
          <Card>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Attendance summary, recent activity, and system information could not be loaded.
              </p>
            </div>
          </Card>
        )}

        {!adminDashboardError && !adminDashboardLoading && adminDashboard && (
          <>
            {/* Attendance Summary */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Attendance Summary (Last 7 Days)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Marked</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminDashboard.attendance_stats.last_7_days.total_marked}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Absent %</p>
                  <p className="text-2xl font-bold text-red-600">
                    {adminDashboard.attendance_stats.last_7_days.absent_percent}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Late %</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {adminDashboard.attendance_stats.last_7_days.late_percent}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Missing Entries</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {adminDashboard.attendance_stats.last_7_days.missing_entries}
                  </p>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              {adminDashboard.recent_activity.length > 0 ? (
                <DataTable data={adminDashboard.recent_activity} columns={recentActivityColumns} />
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </Card>

            {/* System Information */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">App Version</p>
                  <p className="text-base font-medium text-gray-900">
                    {adminDashboard.system.app_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Environment</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {adminDashboard.system.env_label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Django Version</p>
                  <p className="text-base font-medium text-gray-900">
                    {adminDashboard.system.django_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Server Time</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatTimestamp(adminDashboard.system.server_time)}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Module Entry Points */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Module Entry Points
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Core (Users & Roles)', icon: '👤', path: '/system/users' },
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
