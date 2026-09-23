import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDownload } from '@/lib/download'
import { complianceService } from '@/services/compliance'
import { studentsService } from '@/services/students'
import type { RequirementInstance, RequirementStatus, RequirementSubmission } from '@/services/compliance'

export const REQUIREMENT_VARIANT: Record<RequirementStatus, BadgeVariant> = {
  pending: 'warning',
  submitted: 'info',
  verified: 'success',
  rejected: 'danger',
}

export const RequirementStatusBadge: React.FC<{ status: RequirementStatus }> = ({ status }) => (
  <Badge variant={REQUIREMENT_VARIANT[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
)

export const formatDateTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : '—')

/** One line per past submission, newest first, with authenticated file download. */
export const SubmissionHistory: React.FC<{ requirementId: number; submissions: RequirementSubmission[]; admin?: boolean }> = ({ requirementId, submissions, admin = false }) => {
  const { download, error, isDownloading } = useDownload()
  if (submissions.length === 0) return <p className="text-sm text-ink-muted">No submissions yet.</p>
  const ordered = [...submissions].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (
    <div>
      <ul className="space-y-2">
        {ordered.map((submission) => {
          const path = admin
            ? complianceService.adminSubmissionDownloadPath(requirementId, submission.id)
            : complianceService.studentSubmissionDownloadPath(requirementId, submission.id)
          return (
            <li key={submission.id} className="text-sm flex flex-wrap items-center gap-2">
              <span className="text-ink-muted">{formatDateTime(submission.created_at)}</span>
              {submission.submitted_by_name && <span className="text-ink-muted">by {submission.submitted_by_name}</span>}
              {submission.value && <span className="text-ink-primary">“{submission.value}”</span>}
              {submission.has_file && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isDownloading}
                  aria-label={`Download file submitted ${formatDateTime(submission.created_at)}`}
                  onClick={() => download(path, { filename: submission.file_name || 'submission' })}
                >
                  Download file
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** Student name (linked) for an ID; the requirement serializer only carries the ID. */
export const StudentLabel: React.FC<{ studentId: number }> = ({ studentId }) => {
  const { data } = useQuery({
    queryKey: ['student-label', studentId],
    queryFn: () => studentsService.getDetail(studentId),
    staleTime: 5 * 60 * 1000,
  })
  return (
    <Link className="text-primary-600 hover:underline" to={`/students/${studentId}`}>
      {data ? `${data.name} (${data.reg_no})` : `Student #${studentId}`}
    </Link>
  )
}

interface StudentPickerProps {
  id: string
  label: string
  value: string
  onChange: (studentId: string) => void
  placeholder?: string
  required?: boolean
  error?: string
}

/** Search-as-you-type student chooser backed by `/api/students/?search=`. */
export const StudentPicker: React.FC<StudentPickerProps> = ({ id, label, value, onChange, placeholder = 'Any student', required, error }) => {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ value: number; label: string } | null>(null)
  const debounced = useDebouncedValue(search.trim(), 300)
  const { data, isFetching } = useQuery({
    queryKey: ['student-picker', debounced],
    queryFn: () => studentsService.getAll({ search: debounced || undefined }),
    enabled: debounced.length >= 2 || !!value,
  })
  const found = (data?.results ?? []).map((student) => ({ value: student.id, label: `${student.name} (${student.reg_no})` }))
  // Keep the chosen student listed even after a newer search no longer returns them.
  const options = selected && !found.some((option) => String(option.value) === String(selected.value)) ? [selected, ...found] : found
  return (
    <div className="space-y-2">
      <Input
        label={`Find ${label.toLowerCase()}`}
        placeholder="Type a name or registration number"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        helperText={isFetching ? 'Searching…' : undefined}
      />
      <LabeledSelect
        id={id}
        label={label}
        required={required}
        value={value}
        placeholder={placeholder}
        options={options}
        error={error}
        onChange={(next) => {
          setSelected(options.find((option) => String(option.value) === next) ?? null)
          onChange(next)
        }}
      />
    </div>
  )
}

export const requirementNeedsAction = (requirement: Pick<RequirementInstance, 'status'>) =>
  requirement.status === 'pending' || requirement.status === 'rejected'
