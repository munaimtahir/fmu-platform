/**
 * Student-scoped read-only timetable: Today / This Week toggle, consuming
 * GET /api/mobile/student/timetable/. Students cannot edit; cancelled
 * sessions are still shown (with a status badge) rather than hidden, per
 * the mobile schedule contract.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addDays, format, parseISO } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { mobileTimetableService } from '@/services'
import { MobileScheduleEntry } from '@/types'

type Tab = 'today' | 'week'

function EntryRow({ entry }: { entry: MobileScheduleEntry }) {
  const timeLabel = entry.start_time && entry.end_time
    ? `${entry.start_time} - ${entry.end_time}`
    : entry.time_slot || '—'

  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-subtle py-3 last:border-b-0">
      <div>
        <div className="font-medium text-ink-primary">
          {entry.course_name || 'Untitled session'}
          {entry.course_code && <span className="ml-2 text-xs text-ink-muted">{entry.course_code}</span>}
        </div>
        <div className="text-sm text-ink-secondary">{timeLabel}</div>
        <div className="text-sm text-ink-muted">
          {entry.faculty_name && <span>{entry.faculty_name}</span>}
          {entry.faculty_name && entry.room && <span> · </span>}
          {entry.room && <span>{entry.room}</span>}
        </div>
      </div>
      <StatusBadge domain="timetable" status={entry.status} />
    </div>
  )
}

export function StudentTimetableView() {
  const [tab, setTab] = useState<Tab>('today')
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStartParam = useMemo(() => {
    if (weekOffset === 0) return undefined
    return format(addDays(new Date(), weekOffset * 7), 'yyyy-MM-dd')
  }, [weekOffset])

  const { data, isLoading, error } = useQuery({
    queryKey: ['mobile-student-timetable', weekStartParam],
    queryFn: () => mobileTimetableService.getMyWeek(weekStartParam),
  })

  const todayName = format(new Date(), 'EEEE')

  const todayEntries = useMemo(() => {
    if (!data) return []
    return data.entries.filter((e) => e.day_name === todayName)
  }, [data, todayName])

  const entriesByDay = useMemo(() => {
    if (!data) return new Map<string, MobileScheduleEntry[]>()
    const map = new Map<string, MobileScheduleEntry[]>()
    for (const entry of data.entries) {
      const key = entry.day_name || 'Unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    return map
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          data-testid="student-timetable-tab-today"
          size="sm"
          variant={tab === 'today' ? 'primary' : 'ghost'}
          onClick={() => setTab('today')}
        >
          Today
        </Button>
        <Button
          data-testid="student-timetable-tab-week"
          size="sm"
          variant={tab === 'week' ? 'primary' : 'ghost'}
          onClick={() => setTab('week')}
        >
          This Week
        </Button>
      </div>

      {tab === 'week' && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            data-testid="student-timetable-prev-week"
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            ← Previous Week
          </Button>
          <span className="text-ink-secondary">
            {data ? `Week of ${format(parseISO(data.week_start_date), 'MMM dd, yyyy')}` : ''}
          </span>
          <Button
            data-testid="student-timetable-next-week"
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            Next Week →
          </Button>
          {weekOffset !== 0 && (
            <Button
              data-testid="student-timetable-back-to-current-week"
              size="sm"
              variant="ghost"
              onClick={() => setWeekOffset(0)}
            >
              Back to current week
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error">Unable to load your timetable. Please try again later.</Alert>
      ) : tab === 'today' ? (
        <Card padding="md">
          {todayEntries.length === 0 ? (
            <p className="text-ink-muted py-4 text-center">No classes scheduled for today.</p>
          ) : (
            todayEntries.map((entry) => <EntryRow key={`${entry.source}-${entry.id}`} entry={entry} />)
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
            const entries = entriesByDay.get(day) || []
            if (entries.length === 0) return null
            return (
              <Card key={day} padding="md">
                <h3 className="font-semibold text-ink-primary mb-2">{day}</h3>
                {entries.map((entry) => (
                  <EntryRow key={`${entry.source}-${entry.id}`} entry={entry} />
                ))}
              </Card>
            )
          })}
          {data && data.entries.length === 0 && (
            <Card padding="md">
              <p className="text-ink-muted py-4 text-center">No published schedule for this week yet.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
