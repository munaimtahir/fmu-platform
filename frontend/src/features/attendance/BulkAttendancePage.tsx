/**
 * Bulk Attendance Marking Page
 * Allows marking attendance for all students in a section at once
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { sectionsService, studentsService, enrollmentService, attendanceService } from '@/services'

interface AttendanceRecord {
  studentId: number
  studentName: string
  studentRegNo: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
}

export function BulkAttendancePage() {
  const queryClient = useQueryClient()
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // Fetch sections
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsService.getAll({}),
  })

  // Fetch enrollments for selected section
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', selectedSectionId],
    queryFn: () => enrollmentService.getAll({ section: selectedSectionId! }),
    enabled: !!selectedSectionId,
  })

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsService.getAll({}),
  })

  // Initialize attendance records when enrollments are loaded
  useMemo(() => {
    if (enrollmentsData && studentsData) {
      const enrolled = enrollmentsData.results
      const students = studentsData.results

      const records: AttendanceRecord[] = enrolled.map((enrollment) => {
        const student = students.find((s) => s.id === enrollment.student)
        return {
          studentId: enrollment.student,
          studentName: student?.name || 'Unknown',
          studentRegNo: student?.reg_no || 'N/A',
          status: 'Present', // Default to present
        }
      })

      setAttendanceRecords(records)
    }
  }, [enrollmentsData, studentsData])

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: { date: string; records: Array<{ student: number; status: 'Present' | 'Absent' | 'Late' | 'Excused' }> }) =>
      attendanceService.markAttendance(selectedSectionId!, data),
    onSuccess: () => {
      toast.success('Attendance marked successfully')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: () => {
      toast.error('Failed to mark attendance')
    },
  })

  const handleSubmit = () => {
    if (!selectedSectionId) {
      toast.error('Please select a section')
      return
    }

    if (attendanceRecords.length === 0) {
      toast.error('No students enrolled in this section')
      return
    }

    markAttendanceMutation.mutate({
      date: selectedDate,
      records: attendanceRecords.map((record) => ({
        student: record.studentId,
        status: record.status as 'Present' | 'Absent' | 'Late' | 'Excused',
      })),
    })
  }

  const handleMarkAll = (status: AttendanceRecord['status']) => {
    setAttendanceRecords((records) =>
      records.map((record) => ({ ...record, status }))
    )
  }

  const handleMarkStudent = (studentId: number, status: AttendanceRecord['status']) => {
    setAttendanceRecords((records) =>
      records.map((record) =>
        record.studentId === studentId ? { ...record, status } : record
      )
    )
  }

  const stats = useMemo(() => {
    const present = attendanceRecords.filter((r) => r.status === 'Present').length
    const absent = attendanceRecords.filter((r) => r.status === 'Absent').length
    const late = attendanceRecords.filter((r) => r.status === 'Late').length
    const excused = attendanceRecords.filter((r) => r.status === 'Excused').length
    const total = attendanceRecords.length

    return { present, absent, late, excused, total }
  }, [attendanceRecords])

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bulk Attendance Marking</h1>
          <p className="text-gray-600">Mark attendance for an entire section at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Section Selection */}
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Select Section</h2>
            {sectionsLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sectionsData?.results.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSectionId === section.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Section {section.id}</div>
                    <div className="text-sm text-gray-600">
                      Course: {section.course}
                    </div>
                    <div className="text-sm text-gray-600">
                      Teacher: {section.teacher}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Attendance Form */}
          <Card className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Attendance for {selectedDate}</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {!selectedSectionId ? (
              <div className="text-center py-12 text-gray-500">
                Please select a section to mark attendance
              </div>
            ) : enrollmentsLoading ? (
              <div className="text-center py-12 text-gray-500">
                Loading students...
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No students enrolled in this section
              </div>
            ) : (
              <>
                {/* Statistics */}
                <div className="grid grid-cols-5 gap-4 mb-6">
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
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-700">Late</div>
                    <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">Excused</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.excused}</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAll('Present')}>
                    Mark All Present
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAll('Absent')}>
                    Mark All Absent
                  </Button>
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {attendanceRecords.map((record) => (
                    <div
                      key={record.studentId}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{record.studentName}</div>
                        <div className="text-sm text-gray-600">{record.studentRegNo}</div>
                      </div>
                      <div className="flex gap-2">
                        {(['Present', 'Absent', 'Late', 'Excused'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleMarkStudent(record.studentId, status)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              record.status === status
                                ? status === 'Present'
                                  ? 'bg-green-500 text-white'
                                  : status === 'Absent'
                                  ? 'bg-red-500 text-white'
                                  : status === 'Late'
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={markAttendanceMutation.isPending}
                  className="w-full"
                >
                  {markAttendanceMutation.isPending
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
