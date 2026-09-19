/**
 * Section detail: course, period, group, faculty, enrolment and the timetable
 * entries scheduled for the section.  (The backend exposes no roster endpoint,
 * so enrolment is shown as a count.)
 */
import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { apiErrorMessage, parseApiError } from '@/lib/apiErrors'
import { sectionsService } from '@/services/sections'
import { timetableEntryService } from '@/services/weeklyTimetable'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-sm text-ink-secondary">{label}</dt>
    <dd className="text-ink-primary font-medium">{children}</dd>
  </div>
)

export const SectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const sectionId = Number(id)
  const validId = Number.isInteger(sectionId) && sectionId > 0

  const section = useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => sectionsService.getSection(sectionId),
    enabled: validId,
    retry: false,
  })

  const entries = useQuery({
    queryKey: ['timetable-entries', 'section', sectionId],
    queryFn: () => timetableEntryService.getAll({ section: sectionId, ordering: 'day_of_week,start_time' }),
    enabled: validId && section.isSuccess,
  })

  const breadcrumbs = [{ label: 'Sections', path: '/sections' }, { label: 'Section' }]

  if (!validId || (section.isError && parseApiError(section.error).status === 404)) {
    return (
      <PageShell title="Section not found" breadcrumbs={breadcrumbs}>
        <EmptyState icon="🔎" title="Section not found" description="It may have been removed, or you may not have access to it." />
        <div className="text-center mt-4">
          <Link className="text-primary-600 hover:underline" to="/sections">
            Back to sections
          </Link>
        </div>
      </PageShell>
    )
  }

  if (section.isLoading) {
    return (
      <PageShell title="Section" breadcrumbs={breadcrumbs}>
        <LoadingState />
      </PageShell>
    )
  }

  if (section.isError || !section.data) {
    return (
      <PageShell title="Section" breadcrumbs={breadcrumbs}>
        <ErrorState message={apiErrorMessage(section.error, 'Failed to load section')} onRetry={() => section.refetch()} />
      </PageShell>
    )
  }

  const s = section.data
  const rows = entries.data ?? []

  return (
    <PageShell
      title={`${s.course_code} ${s.course_name}`}
      description={`Section ${s.name} • ${s.academic_period_name}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        <Card>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <Fact label="Course">
              {s.course_code} {s.course_name}
            </Fact>
            <Fact label="Section">{s.name}</Fact>
            <Fact label="Academic period">{s.academic_period_name}</Fact>
            <Fact label="Group">{s.group_name ?? 'Whole batch'}</Fact>
            <Fact label="Faculty">{s.faculty_username ?? 'Not assigned'}</Fact>
            <Fact label="Enrolled / capacity">
              {s.enrolled_count} / {s.capacity}
            </Fact>
          </dl>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="text-h3 mb-3">Scheduled entries</h2>
            {entries.isLoading ? (
              <LoadingState />
            ) : entries.isError ? (
              <ErrorState message={apiErrorMessage(entries.error, 'Failed to load timetable entries')} onRetry={() => entries.refetch()} />
            ) : rows.length === 0 ? (
              <p className="text-ink-muted text-sm">No timetable entries are scheduled for this section yet.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2">
                    <span>
                      <span className="font-medium">{DAY_NAMES[entry.day_of_week]}</span>{' '}
                      <span className="text-sm text-ink-secondary">
                        {entry.start_time}–{entry.end_time}
                      </span>
                      {entry.room && <span className="text-xs text-ink-muted ml-2">· {entry.room}</span>}
                    </span>
                    <Badge variant={entry.status === 'CANCELLED' ? 'danger' : 'success'}>{entry.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
