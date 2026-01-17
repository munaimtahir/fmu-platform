/**
 * Session-Based Attendance Marking Page
 * Refactored to use timetable sessions (not course sections)
 */
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { sessionsService, attendanceInputService, attendanceService } from '@/services'
import type { Session, AttendanceRosterStudent, AttendanceSummary } from '@/types'

export function BulkAttendancePage() {
  const queryClient = useQueryClient()
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [roster, setRoster] = useState<AttendanceRosterStudent[]>([])
  const [statusMap, setStatusMap] = useState<Record<number, 'PRESENT' | 'ABSENT'>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', { ordering: 'starts_at' }],
    queryFn: () => sessionsService.getAll({ ordering: 'starts_at' }),
  })

  // Fetch attendance summary for selected session
  const { data: summaryData } = useQuery({
    queryKey: ['attendance-summary', selectedSessionId],
    queryFn: () => attendanceService.getSummary({ session: selectedSessionId! }),
    enabled: !!selectedSessionId,
  })

  // Auto-select first session if none selected
  useEffect(() => {
    if (!selectedSessionId && sessionsData?.results?.length) {
      setSelectedSessionId(sessionsData.results[0].id)
    }
  }, [sessionsData, selectedSessionId])

  // Load roster mutation
  const loadRosterMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const data = await attendanceInputService.getRoster(sessionId)
      return data
    },
    onSuccess: (data) => {
      setRoster(data.students)
      // Initialize status map with existing statuses or default to PRESENT
      const initialStatuses: Record<number, 'PRESENT' | 'ABSENT'> = {}
      data.students.forEach((student: AttendanceRosterStudent) => {
        initialStatuses[student.student_id] = 
          (student.status === 'ABSENT' ? 'ABSENT' : 'PRESENT') as 'PRESENT' | 'ABSENT'
      })
      setStatusMap(initialStatuses)
      toast.success(`Loaded ${data.students.length} students`)
    },
    onError: (error) => {
      console.error('Failed to load roster:', error)
      toast.error('Failed to load roster')
    },
  })

  // Submit attendance mutation
  const submitAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId) throw new Error('No session selected')
      
      // Build records for students marked as ABSENT (backend uses default_status=PRESENT)
      const records = roster
        .filter((s) => statusMap[s.student_id] === 'ABSENT')
        .map((s) => ({
          student_id: s.student_id,
          status: 'A', // Backend expects 'A' for absent
        }))

      return await attendanceInputService.submitLive({
        session_id: selectedSessionId,
        date: selectedDate,
        default_status: 'P', // Present by default
        records,
      })
    },
    onSuccess: (result) => {
      toast.success(`Attendance saved for ${result.total} students`)
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
    },
    onError: (error: any) => {
      console.error('Failed to submit attendance:', error)
      const message = error?.response?.data?.error?.message || error?.message || 'Failed to submit attendance'
      toast.error(message)
    },
  })

  const handleLoadRoster = () => {
    if (!selectedSessionId) {
      toast.error('Please select a session')
      return
    }
    loadRosterMutation.mutate(selectedSessionId)
  }

  const handleSubmit = () => {
    if (!selectedSessionId) {
      toast.error('Please select a session')
      return
    }

    if (roster.length === 0) {
      toast.error('Please load the roster first')
      return
    }

    const absentCount = roster.filter((s) => statusMap[s.student_id] === 'ABSENT').length
    const presentCount = roster.length - absentCount

    if (!window.confirm(
      `Submit attendance for ${roster.length} students?\n` +
      `Present: ${presentCount}, Absent: ${absentCount}`
    )) {
      return
    }

    submitAttendanceMutation.mutate()
  }

  const handleToggleStatus = (studentId: number) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'ABSENT' ? 'PRESENT' : 'ABSENT',
    }))
  }

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const newMap: Record<number, 'PRESENT' | 'ABSENT'> = {}
    roster.forEach((s) => {
      newMap[s.student_id] = status
    })
    setStatusMap(newMap)
  }

  // Filter roster by search
  const filteredRoster = useMemo(() => {
    if (!searchTerm) return roster
    const term = searchTerm.toLowerCase()
    return roster.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.reg_no.toLowerCase().includes(term)
    )
  }, [roster, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    const present = roster.filter((r) => statusMap[r.student_id] === 'PRESENT').length
    const absent = roster.filter((r) => statusMap[r.student_id] === 'ABSENT').length
    const total = roster.length
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0'

    return { present, absent, total, percentage }
  }, [roster, statusMap])

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bulk Attendance Marking</h1>
          <p className="text-gray-600">Mark attendance for a timetable session</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Session Selection Sidebar */}
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Select Session</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {sessionsLoading ? (
              <div className="text-gray-500">Loading sessions...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessionsData?.results.map((session: Session) => {
                  const sessionDate = new Date(session.starts_at)
                  const displayTime = sessionDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const displayDate = sessionDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })

                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSessionId === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {session.group_name || `Group ${session.group}`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {displayDate} • {displayTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.faculty_name || `Faculty ${session.faculty}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <Button
              onClick={handleLoadRoster}
              disabled={!selectedSessionId || loadRosterMutation.isPending}
              variant="secondary"
              className="w-full mt-4"
            >
              {loadRosterMutation.isPending ? 'Loading...' : 'Load Roster'}
            </Button>
          </Card>

          {/* Attendance Form */}
          <Card className="lg:col-span-3">
            {!selectedSessionId ? (
              <div className="text-center py-12 text-gray-500">
                Please select a session
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Click "Load Roster" to begin marking attendance
              </div>
            ) : (
              <>
                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700">Present</div>
                    <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-700">Absent</div>
                    <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">Percentage</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.percentage}%</div>
                  </div>
                </div>

                {/* Summary (if available) */}
                {summaryData && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      Session Summary (All Dates)
                    </div>
                    <div className="text-xs text-blue-700">
                      Total: {summaryData.total} | Present: {summaryData.present} | 
                      Absent: {summaryData.absent} | Attendance: {summaryData.percentage.toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* Search & Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="search"
                    placeholder="Search by name or reg no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAll('PRESENT')}>
                    Mark All Present
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAll('ABSENT')}>
                    Mark All Absent
                  </Button>
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {filteredRoster.map((student) => {
                    const status = statusMap[student.student_id]
                    return (
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-600">{student.reg_no}</div>
                        </div>
                        <Button
                          size="sm"
                          variant={status === 'ABSENT' ? 'danger' : 'secondary'}
                          onClick={() => handleToggleStatus(student.student_id)}
                          className="w-24"
                        >
                          {status === 'ABSENT' ? 'Absent' : 'Present'}
                        </Button>
                      </div>
                    )
                  })}
                  {filteredRoster.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No students match your search
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitAttendanceMutation.isPending || roster.length === 0}
                  className="w-full"
                >
                  {submitAttendanceMutation.isPending
                    ? 'Submitting...'
                    : 'Submit Attendance'}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
