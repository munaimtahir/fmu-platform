/**
 * Lists normalized TimetableEntry rows for a weekly timetable and, for
 * draft timetables the current user can edit, offers an EntryForm to add
 * more. Prefers "cancel" over destructive delete for auditability.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { timetableEntryService } from '@/services'
import { TimetableEntry } from '@/types'
import { EntryForm } from './EntryForm'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  SCHEDULED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'default',
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface EntriesPanelProps {
  weeklyTimetableId: number
  batchId: number
  academicPeriodId: number
  canEdit: boolean
  isDraft: boolean
}

export function EntriesPanel({ weeklyTimetableId, batchId, academicPeriodId, canEdit, isDraft }: EntriesPanelProps) {
  const queryClient = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timetable-entries', weeklyTimetableId],
    queryFn: () => timetableEntryService.getAll({ weekly_timetable: weeklyTimetableId, ordering: 'day_of_week,start_time' }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => timetableEntryService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-entries', weeklyTimetableId] })
      toast.success('Entry cancelled')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to cancel entry')
    },
  })

  if (isLoading) return null

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Course Entries (normalized)</h3>
      <p className="text-sm text-gray-500 mb-3">
        These entries power the student mobile timetable and web timetable view. The grid above is the legacy
        free-text editor and remains available during the transition.
      </p>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm mb-3">No entries yet for this week.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {entries.map((entry: TimetableEntry) => (
            <div key={entry.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <span className="font-medium">{DAY_NAMES[entry.day_of_week]}</span>{' '}
                <span className="text-sm text-gray-600">
                  {entry.start_time}–{entry.end_time}
                </span>{' '}
                <span className="text-sm">
                  {entry.course_code} {entry.course_name}
                </span>
                {entry.group_name && <span className="text-xs text-gray-500 ml-2">({entry.group_name})</span>}
                {entry.room && <span className="text-xs text-gray-500 ml-2">· {entry.room}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[entry.status] || 'default'}>{entry.status}</Badge>
                {canEdit && isDraft && entry.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelMutation.mutate(entry.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && isDraft && (
        <EntryForm weeklyTimetableId={weeklyTimetableId} batchId={batchId} academicPeriodId={academicPeriodId} />
      )}
    </div>
  )
}
