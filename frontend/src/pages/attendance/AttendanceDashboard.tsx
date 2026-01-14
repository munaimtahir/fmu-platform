import { useState, useEffect } from 'react'
import api from '@/api/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

interface Section {
  id: number
  course: number
  course_detail?: { id: number; code: string; title: string; credits: number; program: number }
  term: string
  teacher_name?: string
}

interface AttendanceRecord {
  id: number
  student: number
  student_detail?: { id: number; reg_no: string; name: string; program: string; status: string }
  section: number
  date: string
  present: boolean
  reason: string
}

interface SectionSummary {
  section_id: number
  total_students: number
  total_sessions: number
  average_attendance: number
  students: Array<{
    student_id: number
    student_name: string
    reg_no: string
    present_count: number
    total_sessions: number
    percentage: number
  }>
}

export function AttendanceDashboard() {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<SectionSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'table' | 'stats'>('table')

  // Fetch sections taught by faculty
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await api.get('/api/academics/sections/')
        setSections(response.data.results || response.data)
      } catch (err) {
        setError('Failed to load sections')
        console.error(err)
      }
    }
    fetchSections()
  }, [])

  // Fetch attendance records for selected section
  const fetchAttendance = async (sectionId: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/api/attendance/?section=${sectionId}`)
      setAttendanceRecords(response.data.results || response.data)
    } catch (err) {
      setError('Failed to load attendance records')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch section summary
  const fetchSummary = async (sectionId: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(
        `/api/attendance/section-summary/?section_id=${sectionId}`
      )
      setSummary(response.data)
    } catch (err) {
      setError('Failed to load section summary')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSectionChange = (sectionId: number) => {
    setSelectedSection(sectionId)
    if (view === 'table') {
      fetchAttendance(sectionId)
    } else {
      fetchSummary(sectionId)
    }
  }

  const handleViewToggle = (newView: 'table' | 'stats') => {
    setView(newView)
    if (selectedSection) {
      if (newView === 'table') {
        fetchAttendance(selectedSection)
      } else {
        fetchSummary(selectedSection)
      }
    }
  }

  const attendanceColumns = [
    {
      key: 'student_detail.reg_no',
      label: 'Reg No',
      render: (record: AttendanceRecord) => record.student_detail?.reg_no || '-',
    },
    {
      key: 'student_detail.name',
      label: 'Student Name',
      render: (record: AttendanceRecord) => record.student_detail?.name || '-',
    },
    { key: 'date', label: 'Date' },
    {
      key: 'present',
      label: 'Status',
      render: (record: AttendanceRecord) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.present
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {record.present ? 'Present' : 'Absent'}
        </span>
      ),
    },
    { key: 'reason', label: 'Reason' },
  ]

  const summaryColumns = [
    { key: 'reg_no', label: 'Reg No' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'present_count', label: 'Present' },
    { key: 'total_sessions', label: 'Total' },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (student: SectionSummary['students'][0]) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            student.percentage >= 75
              ? 'bg-green-100 text-green-800'
              : student.percentage >= 50
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {student.percentage.toFixed(1)}%
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'table' ? 'primary' : 'ghost'}
            onClick={() => handleViewToggle('table')}
          >
            Table View
          </Button>
          <Button
            variant={view === 'stats' ? 'primary' : 'ghost'}
            onClick={() => handleViewToggle('stats')}
          >
            Statistics
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Section Selector */}
      <Card>
        <div className="p-4">
          <label className="block text-sm font-medium mb-2">
            Select Section
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedSection || ''}
            onChange={(e) => handleSectionChange(Number(e.target.value))}
          >
            <option value="">-- Choose Section --</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.course_detail
                  ? `${section.course_detail.code} - ${section.course_detail.title} (${section.term})`
                  : `Section ${section.id} - ${section.term}`}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && selectedSection && view === 'table' && (
        <Card>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Attendance Records</h2>
            <SimpleTable
              data={attendanceRecords}
              columns={attendanceColumns}
              keyField="id"
            />
          </div>
        </Card>
      )}

      {!loading && selectedSection && view === 'stats' && summary && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-3xl font-bold">
                  {summary.total_students}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Total Sessions</div>
                <div className="text-3xl font-bold">
                  {summary.total_sessions}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Average Attendance</div>
                <div className="text-3xl font-bold">
                  {summary.average_attendance.toFixed(1)}%
                </div>
              </div>
            </Card>
          </div>

          {/* Student Summary Table */}
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                Student Attendance Summary
              </h2>
              <SimpleTable
                data={summary.students}
                columns={summaryColumns}
                keyField="student_id"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
