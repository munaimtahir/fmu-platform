import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { attendanceInputService, sessionsService } from '@/services'
import { Session } from '@/types'

type TabKey = 'live' | 'csv' | 'sheet'

interface RosterStudent {
  student_id: number
  reg_no: string
  name: string
  status: string | null
}

export function AttendanceInputPage() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [activeTab, setActiveTab] = useState<TabKey>('live')
  const [selectedSession, setSelectedSession] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [statusMap, setStatusMap] = useState<Record<number, string>>({})
  const [search, setSearch] = useState('')

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any>(null)

  // Sheet state
  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [sheetPreview, setSheetPreview] = useState<any>(null)
  const [sheetJobId, setSheetJobId] = useState<number | null>(null)
  const [csvJobId, setCsvJobId] = useState<number | null>(null)

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.getAll({ ordering: 'starts_at' }),
  })

  useEffect(() => {
    if (!selectedSession && sessions?.results?.length) {
      setSelectedSession(sessions.results[0].id)
    }
  }, [sessions, selectedSession])

  const filteredRoster = roster.filter((student) => {
    const term = search.toLowerCase()
    return (
      student.name.toLowerCase().includes(term) ||
      student.reg_no.toLowerCase().includes(term)
    )
  })

  const loadRoster = async () => {
    if (!selectedSession) {
      toast.error('Select a session first')
      return
    }
    try {
      const data = await attendanceInputService.getRoster(selectedSession)
      setRoster(data.students)
      const defaults: Record<number, string> = {}
      data.students.forEach((s: RosterStudent) => {
        defaults[s.student_id] = s.status || 'PRESENT'
      })
      setStatusMap(defaults)
      toast.success('Roster loaded')
    } catch (err) {
      toast.error('Unable to load roster')
    }
  }

  const toggleStatus = (id: number) => {
    setStatusMap((prev) => {
      const next = { ...prev }
      next[id] = prev[id] === 'ABSENT' ? 'PRESENT' : 'ABSENT'
      return next
    })
  }

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    const next: Record<number, string> = {}
    roster.forEach((s) => {
      next[s.student_id] = status
    })
    setStatusMap(next)
  }

  const submitLive = async () => {
    if (!selectedSession) {
      toast.error('Select a session')
      return
    }
    const records = roster
      .filter((s) => statusMap[s.student_id] === 'ABSENT')
      .map((s) => ({
        student_id: s.student_id,
        status: 'A',
      }))

    try {
      const result = await attendanceInputService.submitLive({
        session_id: selectedSession,
        date: selectedDate,
        default_status: 'P',
        records,
      })
      toast.success(`Saved attendance for ${result.total} students`)
    } catch (err) {
      toast.error('Unable to submit attendance')
    }
  }

  const handleCsvDryRun = async () => {
    if (!selectedSession || !csvFile) {
      toast.error('Select a session and choose a CSV file')
      return
    }
    const formData = new FormData()
    formData.append('session_id', String(selectedSession))
    formData.append('date', selectedDate)
    formData.append('file', csvFile)
    try {
      const preview = await attendanceInputService.csvDryRun(formData)
      setCsvPreview(preview)
      setCsvJobId(preview.job_id)
      toast.success('CSV validated')
    } catch (err) {
      toast.error('CSV dry-run failed')
    }
  }

  const handleCsvCommit = async () => {
    if (!csvJobId) {
      toast.error('Run a dry-run first')
      return
    }
    try {
      await attendanceInputService.csvCommit(csvJobId)
      toast.success('CSV attendance committed')
    } catch (err) {
      toast.error('CSV commit failed')
    }
  }

  const handleSheetDryRun = async () => {
    if (!selectedSession || !sheetFile) {
      toast.error('Select a session and upload a scan')
      return
    }
    const formData = new FormData()
    formData.append('session_id', String(selectedSession))
    formData.append('date', selectedDate)
    formData.append('file', sheetFile)
    try {
      const preview = await attendanceInputService.sheetDryRun(formData)
      setSheetPreview(preview.results)
      setSheetJobId(preview.job_id)
      toast.success('Scan analyzed')
    } catch (err) {
      toast.error('Scan dry-run failed')
    }
  }

  const handleSheetCommit = async () => {
    if (!sheetJobId) {
      toast.error('Analyze a scan first')
      return
    }
    const records =
      sheetPreview?.map((row: any) => ({
        student_id: row.student_id,
        status: row.detected_status === 'ABSENT' ? 'A' : 'P',
      })) || []
    try {
      await attendanceInputService.sheetCommit(sheetJobId, records)
      toast.success('Scanned attendance committed')
    } catch (err) {
      toast.error('Sheet commit failed')
    }
  }

  const renderSessionSelect = () => (
    <select
      value={selectedSession ?? ''}
      onChange={(e) => setSelectedSession(Number(e.target.value))}
      className="w-full rounded-lg border border-gray-200 px-3 py-2"
    >
      {sessions?.results?.map((s: Session) => (
        <option key={s.id} value={s.id}>
          {s.group_name || 'Group'} — {new Date(s.starts_at).toLocaleString()}
        </option>
      ))}
    </select>
  )

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Input</h1>
            <p className="text-gray-600">Live taps, CSV uploads, or scanned tick-sheets.</p>
          </div>
          <div className="flex gap-2">
            {(['live', 'csv', 'sheet'] as TabKey[]).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab)}
                className="capitalize"
              >
                {tab === 'live' ? 'Live' : tab === 'csv' ? 'CSV Upload' : 'Scanned Sheet'}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold">Session</h2>
            {renderSessionSelect()}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            {activeTab === 'live' && (
              <Button onClick={loadRoster} variant="secondary" className="w-full">
                Load roster
              </Button>
            )}
            {activeTab === 'sheet' && selectedSession && (
              <a
                href={attendanceInputService.templateUrl(selectedSession)}
                className="text-sm text-blue-600 underline"
              >
                Download tick-sheet template
              </a>
            )}
          </Card>

          <Card className="lg:col-span-3">
            {activeTab === 'live' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => markAll('PRESENT')}>
                      Mark all present
                    </Button>
                    <Button variant="ghost" onClick={() => markAll('ABSENT')}>
                      Mark all absent
                    </Button>
                  </div>
                  <input
                    type="search"
                    placeholder="Search students"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-64 rounded-lg border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-3">
                  {filteredRoster.map((student) => (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.reg_no}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={statusMap[student.student_id] === 'ABSENT' ? 'danger' : 'secondary'}
                        className="w-32 text-center"
                        onClick={() => toggleStatus(student.student_id)}
                      >
                        {statusMap[student.student_id] === 'ABSENT' ? 'Absent' : 'Present'}
                      </Button>
                    </div>
                  ))}
                  {filteredRoster.length === 0 && (
                    <div className="text-center text-gray-500 py-8">Load a session roster to start.</div>
                  )}
                </div>
                <div className="sticky bottom-4 flex justify-end">
                  <Button onClick={submitLive} className="w-full md:w-auto">
                    Submit attendance
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'csv' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Upload CSV</label>
                  <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCsvDryRun}>Preview</Button>
                  <Button variant="secondary" onClick={handleCsvCommit} disabled={!csvJobId}>
                    Commit
                  </Button>
                </div>
                {csvPreview && (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    <div className="font-semibold mb-2">Preview Summary</div>
                    <p>Matched: {csvPreview.matched}</p>
                    <p>Errors: {csvPreview.errors?.length || 0}</p>
                    {csvPreview.errors?.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {csvPreview.errors.map((err: any, idx: number) => (
                          <li key={idx}>
                            Row {err.row}: {err.message || err.reg_no}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sheet' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Upload scan</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setSheetFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSheetDryRun}>Analyze</Button>
                  <Button variant="secondary" onClick={handleSheetCommit} disabled={!sheetJobId}>
                    Commit
                  </Button>
                </div>
                {sheetPreview && (
                  <div className="space-y-2">
                    {sheetPreview.map((row: any) => (
                      <div
                        key={row.student_id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
                      >
                        <div>
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-gray-500">{row.reg_no}</div>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            row.detected_status === 'ABSENT' ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {row.detected_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
