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

interface Assessment {
  id: number
  name: string
  type: string
  max_score: number
  weight: number
  section: number
}

interface AssessmentScore {
  id: number
  assessment: number
  student: { id: number; reg_no: string; full_name: string }
  score: number
}

interface GradebookEntry {
  student_id: number
  student_name: string
  reg_no: string
  scores: { [assessmentId: number]: number }
  total_weighted: number
}

export function Gradebook() {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [scores, setScores] = useState<AssessmentScore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([])

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await api.get('/api/sections/')
        setSections(response.data.results || response.data)
      } catch (err) {
        setError('Failed to load sections')
        console.error(err)
      }
    }
    fetchSections()
  }, [])

  const handleSectionChange = async (sectionId: number) => {
    setSelectedSection(sectionId)
    setLoading(true)
    setError(null)

    try {
      // Fetch assessments for section
      const assessmentsRes = await api.get(
        `/api/assessments/?section=${sectionId}`
      )
      const assessmentsData = assessmentsRes.data.results || assessmentsRes.data
      setAssessments(assessmentsData)

      // Fetch scores
      const scoresRes = await api.get(
        `/api/assessment-scores/?assessment__section=${sectionId}`
      )
      const scoresData = scoresRes.data.results || scoresRes.data
      setScores(scoresData)

      // Build gradebook
      buildGradebook(assessmentsData, scoresData)
    } catch (err) {
      setError('Failed to load gradebook data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const buildGradebook = (
    assessmentsList: Assessment[],
    scoresList: AssessmentScore[]
  ) => {
    // Get unique students
    const studentMap = new Map<number, GradebookEntry>()

    scoresList.forEach((score) => {
      const studentId = score.student.id
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          student_name: score.student.full_name,
          reg_no: score.student.reg_no,
          scores: {},
          total_weighted: 0,
        })
      }

      const entry = studentMap.get(studentId)!
      entry.scores[score.assessment] = score.score
    })

    // Calculate weighted totals
    studentMap.forEach((entry) => {
      let totalWeighted = 0
      assessmentsList.forEach((assessment) => {
        const score = entry.scores[assessment.id] || 0
        const normalizedScore = (score / assessment.max_score) * 100
        totalWeighted += (normalizedScore * assessment.weight) / 100
      })
      entry.total_weighted = totalWeighted
    })

    setGradebook(Array.from(studentMap.values()))
  }

  const handleScoreUpdate = async (
    assessmentId: number,
    studentId: number,
    newScore: number
  ) => {
    try {
      // Find existing score
      const existingScore = scores.find(
        (s) => s.assessment === assessmentId && s.student.id === studentId
      )

      if (existingScore) {
        await api.patch(`/api/assessment-scores/${existingScore.id}/`, {
          score: newScore,
        })
      } else {
        await api.post('/api/assessment-scores/', {
          assessment: assessmentId,
          student: studentId,
          score: newScore,
        })
      }

      // Refresh data
      if (selectedSection) {
        handleSectionChange(selectedSection)
      }
    } catch (err) {
      setError('Failed to update score')
      console.error(err)
    }
  }

  const handleExportCSV = () => {
    if (gradebook.length === 0) {
      setError('No data to export')
      return
    }

    // Create CSV content
    const headers = [
      'Reg No',
      'Student Name',
      ...assessments.map((a) => `${a.name} (${a.weight}%)`),
      'Total (%)',
    ]

    const rows = gradebook.map((entry) => [
      entry.reg_no,
      entry.student_name,
      ...assessments.map((a) => entry.scores[a.id] || 0),
      entry.total_weighted.toFixed(2),
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
    a.download = `gradebook_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0)

  const columns = [
    { key: 'reg_no', label: 'Reg No' },
    { key: 'student_name', label: 'Student Name' },
    ...assessments.map((assessment) => ({
      key: `score_${assessment.id}`,
      label: `${assessment.name} (${assessment.weight}%)`,
      render: (entry: GradebookEntry) =>
        editMode ? (
          <Input
            type="number"
            min="0"
            max={assessment.max_score}
            value={entry.scores[assessment.id] || 0}
            onChange={(e) =>
              handleScoreUpdate(
                assessment.id,
                entry.student_id,
                Number(e.target.value)
              )
            }
            className="w-20"
          />
        ) : (
          <span>{entry.scores[assessment.id] || 0}</span>
        ),
    })),
    {
      key: 'total_weighted',
      label: 'Total (%)',
      render: (entry: GradebookEntry) => (
        <span className="font-semibold">
          {entry.total_weighted.toFixed(1)}%
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gradebook</h1>
        <div className="flex gap-2">
          {gradebook.length > 0 && (
            <>
              <Button onClick={handleExportCSV}>Export CSV</Button>
              <Button
                variant={editMode ? 'primary' : 'ghost'}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'View Mode' : 'Edit Mode'}
              </Button>
            </>
          )}
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

      {!loading && selectedSection && assessments.length > 0 && (
        <>
          {/* Weight Meter */}
          <Card>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Total Assessment Weight
                </span>
                <span
                  className={`text-lg font-bold ${
                    totalWeight === 100
                      ? 'text-green-600'
                      : totalWeight < 100
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {totalWeight}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    totalWeight === 100
                      ? 'bg-green-500'
                      : totalWeight < 100
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(totalWeight, 100)}%` }}
                />
              </div>
              {totalWeight !== 100 && (
                <p className="text-sm text-gray-600 mt-2">
                  {totalWeight < 100
                    ? `Warning: Total weight is ${100 - totalWeight}% below 100%`
                    : `Error: Total weight exceeds 100% by ${totalWeight - 100}%`}
                </p>
              )}
            </div>
          </Card>

          {/* Gradebook Table */}
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Student Grades</h2>
              <SimpleTable
                data={gradebook}
                columns={columns}
                keyField="student_id"
              />
            </div>
          </Card>
        </>
      )}

      {!loading && selectedSection && assessments.length === 0 && (
        <Card>
          <div className="p-4 text-center text-gray-600">
            No assessments found for this section
          </div>
        </Card>
      )}
    </div>
  )
}
