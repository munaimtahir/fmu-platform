/**
 * Attendance Dashboard - Session-Based View
 * View attendance records and statistics by timetable session
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { sessionsService, attendanceService } from '@/services'
import type { Session, Attendance, AttendanceSummary } from '@/types'

export function AttendanceDashboard() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [view, setView] = useState<'records' | 'summary'>('records')

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', { ordering: 'starts_at' }],
    queryFn: () => sessionsService.getAll({ ordering: 'starts_at' }),
  })

  // Auto-select first session
  useEffect(() => {
    if (!selectedSessionId && sessionsData?.results?.length) {
      setSelectedSessionId(sessionsData.results[0].id)
    }
  }, [sessionsData, selectedSessionId])

  // Fetch attendance records for selected session
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', selectedSessionId],
    queryFn: () => attendanceService.getBySessionId(selectedSessionId!),
    enabled: !!selectedSessionId,
  })

  // Fetch attendance summary for selected session
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance-summary', selectedSessionId],
    queryFn: () => attendanceService.getSummary({ session: selectedSessionId! }),
    enabled: !!selectedSessionId && view === 'summary',
  })

  const handleSessionChange = (sessionId: number) => {
    setSelectedSessionId(sessionId)
  }

  const handleViewToggle = (newView: 'records' | 'summary') => {
    setView(newView)
  }

  const attendanceColumns = [
    {
      key: 'student_reg_no',
      label: 'Reg No',
      render: (record: Attendance) => record.student_reg_no || '-',
    },
    {
      key: 'student_name',
      label: 'Student Name',
      render: (record: Attendance) => record.student_name || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (record: Attendance) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.status === 'PRESENT'
              ? 'bg-green-100 text-green-800'
              : record.status === 'ABSENT'
              ? 'bg-red-100 text-red-800'
              : record.status === 'LATE'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {record.status}
        </span>
      ),
    },
    {
      key: 'marked_at',
      label: 'Marked At',
      render: (record: Attendance) => 
        new Date(record.marked_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      key: 'marked_by_username',
      label: 'Marked By',
      render: (record: Attendance) => record.marked_by_username || '-',
    },
  ]

  const loading = view === 'records' ? attendanceLoading : summaryLoading

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
            <p className="text-gray-600">View attendance records and statistics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'records' ? 'primary' : 'ghost'}
              onClick={() => handleViewToggle('records')}
            >
              Records
            </Button>
            <Button
              variant={view === 'summary' ? 'primary' : 'ghost'}
              onClick={() => handleViewToggle('summary')}
            >
              Summary
            </Button>
          </div>
        </div>

        {/* Session Selector */}
        <Card>
          <div className="p-4">
            <label className="block text-sm font-medium mb-2">
              Select Session
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedSessionId || ''}
              onChange={(e) => handleSessionChange(Number(e.target.value))}
              disabled={sessionsLoading}
            >
              <option value="">-- Choose Session --</option>
              {sessionsData?.results.map((session: Session) => {
                const sessionDate = new Date(session.starts_at)
                const displayTime = sessionDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const displayDate = sessionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <option key={session.id} value={session.id}>
                    {session.group_name || `Group ${session.group}`} • {displayDate} {displayTime} • 
                    {session.faculty_name || `Faculty ${session.faculty}`}
                  </option>
                )
              })}
            </select>
          </div>
        </Card>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && !selectedSessionId && (
          <Alert variant="info">
            Please select a session to view attendance data
          </Alert>
        )}

        {/* Records View */}
        {!loading && selectedSessionId && view === 'records' && (
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Attendance Records</h2>
              {attendanceData?.results && attendanceData.results.length > 0 ? (
                <SimpleTable
                  data={attendanceData.results}
                  columns={attendanceColumns}
                  keyField="id"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for this session
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Summary View */}
        {!loading && selectedSessionId && view === 'summary' && summaryData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <div className="p-4">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-3xl font-bold">
                    {summaryData.total}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-green-700">Present</div>
                  <div className="text-3xl font-bold text-green-700">
                    {summaryData.present}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-red-700">Absent</div>
                  <div className="text-3xl font-bold text-red-700">
                    {summaryData.absent}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-yellow-700">Late</div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {summaryData.late}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-blue-700">Percentage</div>
                  <div className="text-3xl font-bold text-blue-700">
                    {summaryData.percentage.toFixed(1)}%
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
