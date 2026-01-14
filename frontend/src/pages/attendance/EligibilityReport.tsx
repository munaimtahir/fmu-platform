import { useState, useEffect } from 'react'
import api from '@/api/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'

interface Section {
  id: number
  course: number
  course_detail?: { id: number; code: string; title: string; credits: number; program: number }
  term: string
  teacher_name?: string
}

interface EligibilityRecord {
  student_id: number
  student_name: string
  reg_no: string
  section_id: number
  present_count: number
  total_sessions: number
  percentage: number
  eligible: boolean
}

export function EligibilityReport() {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSections, setSelectedSections] = useState<number[]>([])
  const [threshold, setThreshold] = useState<number>(75)
  const [eligibilityData, setEligibilityData] = useState<EligibilityRecord[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch sections
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

  const handleGenerateReport = async () => {
    if (selectedSections.length === 0) {
      setError('Please select at least one section')
      return
    }

    setLoading(true)
    setError(null)
    const records: EligibilityRecord[] = []

    try {
      for (const sectionId of selectedSections) {
        const response = await api.get(
          `/api/attendance/section-summary/?section_id=${sectionId}`
        )
        const summary = response.data

        summary.students.forEach((student: any) => {
          records.push({
            student_id: student.student_id,
            student_name: student.student_name,
            reg_no: student.reg_no,
            section_id: sectionId,
            present_count: student.present_count,
            total_sessions: student.total_sessions,
            percentage: student.percentage,
            eligible: student.percentage >= threshold,
          })
        })
      }

      setEligibilityData(records)
    } catch (err) {
      setError('Failed to generate eligibility report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (eligibilityData.length === 0) {
      setError('No data to export')
      return
    }

    // Create CSV content
    const headers = [
      'Reg No',
      'Student Name',
      'Section ID',
      'Present',
      'Total',
      'Percentage',
      'Eligible',
    ]
    const rows = eligibilityData.map((record) => [
      record.reg_no,
      record.student_name,
      record.section_id,
      record.present_count,
      record.total_sessions,
      record.percentage.toFixed(2),
      record.eligible ? 'Yes' : 'No',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eligibility_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleSectionToggle = (sectionId: number) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const columns = [
    { key: 'reg_no', label: 'Reg No' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'section_id', label: 'Section' },
    { key: 'present_count', label: 'Present' },
    { key: 'total_sessions', label: 'Total' },
    {
      key: 'percentage',
      label: 'Attendance %',
      render: (record: EligibilityRecord) => `${record.percentage.toFixed(1)}%`,
    },
    {
      key: 'eligible',
      label: 'Eligible',
      render: (record: EligibilityRecord) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.eligible
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {record.eligible ? 'Eligible' : 'Not Eligible'}
        </span>
      ),
    },
  ]

  const eligibleCount = eligibilityData.filter((r) => r.eligible).length
  const ineligibleCount = eligibilityData.length - eligibleCount

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Eligibility Report</h1>
        {eligibilityData.length > 0 && (
          <Button onClick={handleExportCSV}>Export CSV</Button>
        )}
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Configuration */}
      <Card>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Attendance Threshold (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Sections
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sections.map((section) => (
                <label key={section.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section.id)}
                    onChange={() => handleSectionToggle(section.id)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {section.course_detail
                      ? `${section.course_detail.code} - ${section.course_detail.title} (${section.term})`
                      : `Section ${section.id} - ${section.term}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && eligibilityData.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-3xl font-bold">
                  {eligibilityData.length}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Eligible</div>
                <div className="text-3xl font-bold text-green-600">
                  {eligibleCount}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Not Eligible</div>
                <div className="text-3xl font-bold text-red-600">
                  {ineligibleCount}
                </div>
              </div>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                Eligibility Details
              </h2>
              <SimpleTable
                data={eligibilityData}
                columns={columns}
                keyField="student_id"
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
