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

interface Result {
  id: number
  student: { reg_no: string; full_name: string }
  section: { id: number; course: { code: string } }
  grade: string
  marks: number
  state: string
}

export function PublishResults() {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [action, setAction] = useState<'publish' | 'freeze' | null>(null)

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

  const handleSectionChange = async (sectionId: number) => {
    setSelectedSection(sectionId)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.get(`/api/results/?section=${sectionId}`)
      setResults(response.data.results || response.data)
    } catch (err) {
      setError('Failed to load results')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedSection) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.post('/api/results/publish/', {
        section_id: selectedSection,
      })
      setSuccess('Results published successfully!')
      setShowConfirmModal(false)
      // Refresh results
      handleSectionChange(selectedSection)
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to publish results'
      )
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFreeze = async () => {
    if (!selectedSection) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.post('/api/results/freeze/', {
        section_id: selectedSection,
      })
      setSuccess('Results frozen successfully! No further edits allowed.')
      setShowConfirmModal(false)
      // Refresh results
      handleSectionChange(selectedSection)
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to freeze results'
      )
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (action === 'publish') {
      handlePublish()
    } else if (action === 'freeze') {
      handleFreeze()
    }
  }

  const openConfirmModal = (actionType: 'publish' | 'freeze') => {
    setAction(actionType)
    setShowConfirmModal(true)
  }

  const columns = [
    {
      key: 'student.reg_no',
      label: 'Reg No',
      render: (result: Result) => result.student.reg_no,
    },
    {
      key: 'student.full_name',
      label: 'Student Name',
      render: (result: Result) => result.student.full_name,
    },
    { key: 'marks', label: 'Marks' },
    { key: 'grade', label: 'Grade' },
    {
      key: 'state',
      label: 'Status',
      render: (result: Result) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            result.state === 'frozen'
              ? 'bg-blue-100 text-blue-800'
              : result.state === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {result.state.charAt(0).toUpperCase() + result.state.slice(1)}
        </span>
      ),
    },
  ]

  const draftCount = results.filter((r) => r.state === 'draft').length
  const publishedCount = results.filter((r) => r.state === 'published').length
  const frozenCount = results.filter((r) => r.state === 'frozen').length
  const canPublish = draftCount > 0
  const canFreeze = publishedCount > 0 && frozenCount === 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Publish Results</h1>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          {success}
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

      {!loading && selectedSection && results.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Draft Results</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {draftCount}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Published Results</div>
                <div className="text-3xl font-bold text-green-600">
                  {publishedCount}
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600">Frozen Results</div>
                <div className="text-3xl font-bold text-blue-600">
                  {frozenCount}
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => openConfirmModal('publish')}
              disabled={!canPublish}
              variant="primary"
            >
              Publish Results
            </Button>
            <Button
              onClick={() => openConfirmModal('freeze')}
              disabled={!canFreeze}
              variant="ghost"
            >
              Freeze Results (Final Lock)
            </Button>
          </div>

          {/* Results Table */}
          <Card>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">Results Overview</h2>
              <SimpleTable data={results} columns={columns} keyField="id" />
            </div>
          </Card>
        </>
      )}

      {!loading && selectedSection && results.length === 0 && (
        <Card>
          <div className="p-4 text-center text-gray-600">
            No results found for this section
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">
                {action === 'publish' ? 'Publish Results?' : 'Freeze Results?'}
              </h2>
              <p className="text-gray-600">
                {action === 'publish'
                  ? 'Publishing results will make them visible to students. Draft results will become published.'
                  : 'Freezing results will permanently lock them. No further changes will be allowed. This action cannot be undone.'}
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading
                    ? 'Processing...'
                    : action === 'publish'
                      ? 'Publish'
                      : 'Freeze'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
