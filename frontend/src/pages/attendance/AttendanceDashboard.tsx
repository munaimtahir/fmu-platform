/**
 * Attendance Dashboard - Session-Based View
 * View attendance records and statistics by timetable session
 */
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Heading, Text } from '@/components/ui/Typography'
import { sessionsService, attendanceService } from '@/services'
import type { Session, Attendance } from '@/types'

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

  const attendanceColumns = useMemo<ColumnDef<Attendance>[]>(
    () => [
      {
        id: 'student_reg_no',
        header: 'Reg No',
        accessorFn: (record) => record.student_reg_no || '-',
      },
      {
        id: 'student_name',
        header: 'Student Name',
        accessorFn: (record) => record.student_name || '-',
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (record) => record.status,
        cell: ({ row }) => <StatusBadge domain="attendance" status={row.original.status} />,
      },
      {
        id: 'marked_at',
        header: 'Marked At',
        accessorFn: (record) => record.marked_at,
        cell: ({ row }) =>
          new Date(row.original.marked_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
      {
        id: 'marked_by_username',
        header: 'Marked By',
        accessorFn: (record) => record.marked_by_username || '-',
      },
    ],
    []
  )

  const loading = view === 'records' ? attendanceLoading : summaryLoading

  return (
    
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <Heading level={1}>Attendance Dashboard</Heading>
            <Text tone="secondary">View attendance records and statistics</Text>
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
            <label htmlFor="attendance-session-select" className="block text-sm font-medium mb-2">
              Select Session
            </label>
            <select
              id="attendance-session-select"
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
              <Heading level={3} className="mb-4">Attendance Records</Heading>
              {attendanceData?.results && attendanceData.results.length > 0 ? (
                <DataTable data={attendanceData.results} columns={attendanceColumns} />
              ) : (
                <div className="text-center py-8 text-ink-muted">
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
                  <div className="text-body-sm text-ink-secondary">Total</div>
                  <div className="text-h1 text-ink-primary">
                    {summaryData.total}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-success">Present</div>
                  <div className="text-h1 text-success">
                    {summaryData.present}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-danger">Absent</div>
                  <div className="text-h1 text-danger">
                    {summaryData.absent}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-warning">Late</div>
                  <div className="text-h1 text-warning">
                    {summaryData.late}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-info">Percentage</div>
                  <div className="text-h1 text-info">
                    {summaryData.percentage.toFixed(1)}%
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    
  )
}
