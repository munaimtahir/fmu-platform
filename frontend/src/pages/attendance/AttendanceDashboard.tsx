/**
 * Attendance Dashboard - Session-Based View
 * View attendance records and statistics by timetable session
 */
import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAuth } from '@/features/auth/useAuth'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { apiErrorMessage } from '@/lib/apiErrors'
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '@/services/attendance'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Heading, Text } from '@/components/ui/Typography'
import { sessionsService, attendanceService } from '@/services'
import type { Session, Attendance } from '@/types'

export function AttendanceDashboard() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { can } = useCapabilities()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [view, setView] = useState<'records' | 'summary'>('records')
  const [detail, setDetail] = useState<Attendance | null>(null)
  const [editing, setEditing] = useState<Attendance | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT')
  const [editError, setEditError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Attendance | null>(null)
  const [exporting, setExporting] = useState(false)

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

  const selectedSession = sessionsData?.results.find((session: Session) => session.id === selectedSessionId)
  // Mirrors the backend rule (IsAttendanceEditor): the edit task, or teaching the record's session.
  const canManage = can('attendance.attendances.edit') || (!!user && selectedSession?.faculty === user.id)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] })
    queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
  }

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; status: AttendanceStatus }) => attendanceService.updateStatus(input.id, input.status),
    onSuccess: () => {
      invalidate()
      toast.success('Attendance updated')
      setEditing(null)
    },
    onError: (error) => setEditError(apiErrorMessage(error, 'Failed to update attendance')),
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      await attendanceService.exportCsv({ session: selectedSessionId ?? undefined })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const record = row.original
          return (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => setDetail(record)} aria-label={`View ${record.student_reg_no ?? record.id}`}>
                View
              </Button>
              {canManage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditStatus(record.status)
                      setEditError(null)
                      setEditing(record)
                    }}
                    aria-label={`Edit ${record.student_reg_no ?? record.id}`}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(record)} aria-label={`Delete ${record.student_reg_no ?? record.id}`}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [canManage]
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
            <Button variant="secondary" onClick={handleExport} isLoading={exporting} disabled={!selectedSessionId}>
              Export CSV
            </Button>
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

        {detail && (
          <Modal title="Attendance record" onClose={() => setDetail(null)}>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-muted">Student</dt><dd>{detail.student_reg_no} - {detail.student_name}</dd></div>
              <div><dt className="text-ink-muted">Status</dt><dd><StatusBadge domain="attendance" status={detail.status} /></dd></div>
              <div><dt className="text-ink-muted">Department</dt><dd>{detail.session_department || '-'}</dd></div>
              <div><dt className="text-ink-muted">Marked by</dt><dd>{detail.marked_by_username || '-'}</dd></div>
              <div><dt className="text-ink-muted">Marked at</dt><dd>{new Date(detail.marked_at).toLocaleString()}</dd></div>
              <div><dt className="text-ink-muted">Last updated</dt><dd>{new Date(detail.updated_at).toLocaleString()}</dd></div>
            </dl>
            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
            </div>
          </Modal>
        )}

        {editing && (
          <Modal title={`Edit attendance - ${editing.student_reg_no ?? editing.id}`} onClose={() => setEditing(null)}>
            <div className="space-y-4">
              {editError && <Alert variant="error">{editError}</Alert>}
              <div>
                <label htmlFor="attendance-edit-status" className="block text-sm font-medium mb-1">Status</label>
                <select
                  id="attendance-edit-status"
                  className="w-full p-2 border rounded-md"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                >
                  {ATTENDANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setEditing(null)} disabled={updateMutation.isPending}>Cancel</Button>
                <Button
                  onClick={() => {
                    setEditError(null)
                    updateMutation.mutate({ id: editing.id, status: editStatus })
                  }}
                  isLoading={updateMutation.isPending}
                  disabled={editStatus === editing.status}
                >
                  Save
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {deleting && (
          <ConfirmDialog
            title="Delete attendance record?"
            message={<>This permanently removes the record for <strong>{deleting.student_reg_no} - {deleting.student_name}</strong>. It cannot be undone.</>}
            confirmLabel="Delete"
            variant="danger"
            onClose={() => setDeleting(null)}
            onConfirm={async () => {
              await attendanceService.remove(deleting.id)
              invalidate()
              toast.success('Attendance record deleted')
            }}
          />
        )}
      </div>
    
  )
}
