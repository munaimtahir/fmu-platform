import { useState, useEffect, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import api from '@/api/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'

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

  const columns = useMemo<ColumnDef<EligibilityRecord>[]>(
    () => [
      { accessorKey: 'reg_no', header: 'Reg No' },
      { accessorKey: 'student_name', header: 'Student Name' },
      { accessorKey: 'section_id', header: 'Section' },
      { accessorKey: 'present_count', header: 'Present' },
      { accessorKey: 'total_sessions', header: 'Total' },
      {
        id: 'percentage',
        header: 'Attendance %',
        accessorFn: (record) => record.percentage,
        cell: ({ row }) => `${row.original.percentage.toFixed(1)}%`,
      },
      {
        id: 'eligible',
        header: 'Eligible',
        accessorFn: (record) => record.eligible,
        cell: ({ row }) => {
          const record = row.original
          return (
            <StatusBadge
              domain="attendance"
              status={record.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
              label={record.eligible ? 'Eligible' : 'Not Eligible'}
            />
          )
        },
      },
    ],
    []
  )

  const eligibleCount = eligibilityData.filter((r) => r.eligible).length
  const ineligibleCount = eligibilityData.length - eligibleCount

  return (
    
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <h1 className="text-h1">Eligibility Report</h1>
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
              <Input
                id="eligibility-threshold"
                label="Attendance Threshold (%)"
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-ink-primary mb-1.5">
                Select Sections
              </legend>
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
            </fieldset>

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
                  <div className="text-sm text-ink-secondary">Total Students</div>
                  <div className="text-h1">
                    {eligibilityData.length}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-ink-secondary">Eligible</div>
                  <div className="text-h1 text-success">
                    {eligibleCount}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <div className="text-sm text-ink-secondary">Not Eligible</div>
                  <div className="text-h1 text-danger">
                    {ineligibleCount}
                  </div>
                </div>
              </Card>
            </div>

            {/* Results Table */}
            <Card>
              <div className="p-4">
                <h2 className="text-h3 mb-4">
                  Eligibility Details
                </h2>
                <DataTable data={eligibilityData} columns={columns} />
              </div>
            </Card>
          </>
        )}
      </div>
    
  )
}
