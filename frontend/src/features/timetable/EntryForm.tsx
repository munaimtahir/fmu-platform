/**
 * Section-aware form for creating a normalized TimetableEntry, replacing
 * the legacy free-text line1/2/3 cell inputs for new writes. Only usable
 * against a draft weekly timetable (enforced server-side too).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import api from '@/api/axios'
import { academicsService, timetableEntryService } from '@/services'

// The shared `sectionsService`/`Section` type target a stale, mismatched
// shape (course/term/teacher/capacity) that doesn't match the actual
// academics.Section API (course_code/name/academic_period/group). Querying
// the real endpoint directly here avoids surfacing that pre-existing
// mismatch as a bug in this new form.
interface AcademicSection {
  id: number
  course_code: string
  course_name: string
  name: string
}

const DAY_OPTIONS = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
]

interface EntryFormProps {
  weeklyTimetableId: number
  batchId: number
  academicPeriodId: number
}

export function EntryForm({ weeklyTimetableId, batchId, academicPeriodId }: EntryFormProps) {
  const queryClient = useQueryClient()
  const [sectionId, setSectionId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('0')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [room, setRoom] = useState('')

  const { data: sections = [] } = useQuery({
    queryKey: ['academic-sections', academicPeriodId],
    queryFn: async () => {
      const response = await api.get<{ results: AcademicSection[] } | AcademicSection[]>('/api/academics/sections/', {
        params: { academic_period: academicPeriodId },
      })
      return Array.isArray(response.data) ? response.data : response.data.results
    },
  })

  const { data: groups } = useQuery({
    queryKey: ['academic-groups', batchId],
    queryFn: () => academicsService.getGroups({ batch: batchId }),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      timetableEntryService.create({
        weekly_timetable: weeklyTimetableId,
        section: parseInt(sectionId, 10),
        group: groupId ? parseInt(groupId, 10) : null,
        day_of_week: parseInt(dayOfWeek, 10),
        start_time: startTime,
        end_time: endTime,
        room: room || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-entries', weeklyTimetableId] })
      toast.success('Entry added')
      setSectionId('')
      setRoom('')
    },
    onError: (error: any) => {
      const detail = error?.response?.data
      const message = Array.isArray(detail) ? detail.join(', ') : detail?.detail || error?.message || 'Failed to add entry'
      toast.error(message)
    },
  })

  const sectionOptions = [
    { value: '', label: 'Select Section...' },
    ...sections.map((s) => ({ value: String(s.id), label: `${s.course_code || ''} ${s.name}`.trim() || `Section ${s.id}` })),
  ]

  const groupOptions = [
    { value: '', label: 'Whole batch (no specific group)' },
    ...(groups || []).map((g) => ({ value: String(g.id), label: g.name })),
  ]

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-4 bg-gray-50 rounded-lg"
      onSubmit={(e) => {
        e.preventDefault()
        if (!sectionId) {
          toast.error('Select a section')
          return
        }
        createMutation.mutate()
      }}
    >
      <div className="md:col-span-2">
        <label className="text-xs text-gray-600">Section</label>
        <Select data-testid="entry-form-section-select" options={sectionOptions} value={sectionId} onChange={setSectionId} />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-gray-600">Group</label>
        <Select data-testid="entry-form-group-select" options={groupOptions} value={groupId} onChange={setGroupId} />
      </div>
      <div>
        <label className="text-xs text-gray-600">Day</label>
        <Select data-testid="entry-form-day-select" options={DAY_OPTIONS} value={dayOfWeek} onChange={setDayOfWeek} />
      </div>
      <div>
        <label className="text-xs text-gray-600">Start</label>
        <input
          data-testid="entry-form-start-time"
          type="time"
          className="w-full border rounded px-2 py-1.5 text-sm"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-gray-600">End</label>
        <input
          data-testid="entry-form-end-time"
          type="time"
          className="w-full border rounded px-2 py-1.5 text-sm"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-gray-600">Room</label>
        <input
          data-testid="entry-form-room"
          type="text"
          className="w-full border rounded px-2 py-1.5 text-sm"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="md:col-span-6">
        <Button data-testid="entry-form-submit-button" type="submit" size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Entry'}
        </Button>
      </div>
    </form>
  )
}
