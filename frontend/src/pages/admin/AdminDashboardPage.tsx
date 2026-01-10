import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { dashboardApi, AdminDashboardData } from '@/api/dashboard'
import { SimpleTable } from '@/components/ui/SimpleTable'

/**
 * Admin Dashboard Page - Overview of system statistics and recent activity
 */
export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const dashboardData = await dashboardApi.getAdminDashboard()
        setData(dashboardData)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch admin dashboard:', err)
        setError(err.response?.data?.error || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <PageShell title="Admin Dashboard" description="System overview and statistics">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Admin Dashboard" description="System overview and statistics">
          <div className="flex items-center justify-center h-64">
            <p className="text-red-600">{error}</p>
          </div>
        </PageShell>
      </DashboardLayout>
    )
  }

  if (!data) {
    return null
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return timestamp
    }
  }

  return (
    <DashboardLayout>
      <PageShell title="Admin Dashboard" description="System overview and statistics">
        <div className="space-y-6">
          {/* Counts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.counts.students}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    👥
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Faculty</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.counts.faculty}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    👨‍🏫
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Programs</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.counts.programs}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                    📚
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {data.counts.courses}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                    📖
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Attendance Stats */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Attendance Summary (Last 7 Days)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Marked</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.attendance_stats.last_7_days.total_marked}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Absent %</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.attendance_stats.last_7_days.absent_percent}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Late %</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {data.attendance_stats.last_7_days.late_percent}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Missing Entries</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.attendance_stats.last_7_days.missing_entries}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              {data.recent_activity.length > 0 ? (
                <SimpleTable
                  data={data.recent_activity}
                  keyField="id"
                  columns={[
                    {
                      key: 'timestamp',
                      label: 'Time',
                      render: (item) => formatTimestamp(item.timestamp),
                    },
                    {
                      key: 'actor',
                      label: 'Actor',
                    },
                    {
                      key: 'action',
                      label: 'Action',
                    },
                    {
                      key: 'entity',
                      label: 'Entity',
                    },
                    {
                      key: 'summary',
                      label: 'Summary',
                      render: (item) => (
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {item.summary}
                        </span>
                      ),
                    },
                  ]}
                />
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </Card>

          {/* System Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">App Version</p>
                  <p className="text-base font-medium text-gray-900">
                    {data.system.app_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Environment</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {data.system.env_label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Django Version</p>
                  <p className="text-base font-medium text-gray-900">
                    {data.system.django_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Server Time</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatTimestamp(data.system.server_time)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </PageShell>
    </DashboardLayout>
  )
}
