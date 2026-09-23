import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { apiErrorMessage, parseApiError } from '@/lib/apiErrors'
import type { Batch } from '@/services/batches'
import type { Group } from '@/services/academics'
import type { Program } from '@/types'
import { allPages } from '@/lib/allPages'
import { resultsService } from '@/services/results'
import { complianceService, type RequirementStatus } from '@/services/compliance'
import {
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  leavePeriodsService,
  type LeavePeriod,
  type LeaveStatus,
  type LeaveType,
} from '@/services/leavePeriods'
import { studentsService, type StudentDetail } from '@/services/students'

const optionLabel = (options: Array<{ value: string; label: string }>, value: string) =>
  options.find((option) => option.value === value)?.label ?? value

const LEAVE_VARIANT: Record<LeaveStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'default',
}

const REQUIREMENT_VARIANT: Record<RequirementStatus, BadgeVariant> = {
  pending: 'warning',
  submitted: 'info',
  verified: 'success',
  rejected: 'danger',
}

const SectionLoading = () => (
  <div className="flex justify-center py-6">
    <Spinner />
  </div>
)

const SectionError: React.FC<{ error: unknown }> = ({ error }) => <Alert variant="error">{apiErrorMessage(error)}</Alert>

// ------------------------------------------------------------------- Placement

const PlacementForm: React.FC<{ student: StudentDetail; onClose: () => void }> = ({ student, onClose }) => {
  const queryClient = useQueryClient()
  const [program, setProgram] = useState(String(student.program ?? ''))
  const [batch, setBatch] = useState(String(student.batch ?? ''))
  const [group, setGroup] = useState(String(student.group ?? ''))
  const [error, setError] = useState<string | null>(null)

  const programs = useQuery({ queryKey: ['placement-programs'], queryFn: async () => ({ results: await allPages<Program>('/api/academics/programs/', { is_active: true }) }) })
  const batches = useQuery({
    queryKey: ['placement-batches', program],
    queryFn: async () => ({ results: await allPages<Batch>('/api/academics/batches/', { program: Number(program), is_active: true }) }),
    enabled: !!program,
  })
  const groups = useQuery({
    queryKey: ['placement-groups', batch],
    queryFn: () => allPages<Group>('/api/academics/groups/', { batch: Number(batch) }),
    enabled: !!batch,
  })

  const mutation = useMutation({
    mutationFn: () =>
      studentsService.updatePlacement(student.id, {
        program: Number(program),
        batch: Number(batch),
        group: group ? Number(group) : null,
      }),
    onSuccess: () => {
      toast.success('Placement updated')
      queryClient.invalidateQueries({ queryKey: ['student', student.id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      onClose()
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!program || !batch) {
      setError('Choose a program and batch.')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title="Change placement" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {(programs.isError || batches.isError || groups.isError) && <Alert variant="error">Could not load placement choices. <Button type="button" onClick={() => { programs.refetch(); if (program) batches.refetch(); if (batch) groups.refetch() }}>Retry</Button></Alert>}
        {error && <Alert variant="error">{error}</Alert>}
        <LabeledSelect
          id="placement-program"
          label="Program"
          required
          value={program}
          placeholder="Select a program"
          options={(programs.data?.results ?? []).map((p) => ({ value: p.id, label: p.name }))}
          onChange={(value) => {
            setProgram(value)
            setBatch('')
            setGroup('')
          }}
        />
        <LabeledSelect
          id="placement-batch"
          label="Batch"
          required
          value={batch}
          placeholder="Select a batch"
          disabled={!program}
          options={(batches.data?.results ?? []).map((b) => ({ value: b.id, label: b.name }))}
          onChange={(value) => {
            setBatch(value)
            setGroup('')
          }}
        />
        <LabeledSelect
          id="placement-group"
          label="Group"
          value={group}
          placeholder="No group assigned"
          disabled={!batch}
          options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
          onChange={setGroup}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending} disabled={programs.isFetching || batches.isFetching || groups.isFetching || programs.isError || batches.isError || groups.isError}>
            Save placement
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const PlacementCard: React.FC<{ student: StudentDetail }> = ({ student }) => {
  const [isEditing, setIsEditing] = useState(false)
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-ink-primary">Placement</h2>
        <Can tasks={['students.students.manage_placement']}>
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
            Change placement
          </Button>
        </Can>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <dt className="text-sm text-ink-muted">Program</dt>
          <dd className="text-ink-primary">{student.program_name || '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Batch</dt>
          <dd className="text-ink-primary">{student.batch_name || '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Group</dt>
          <dd className="text-ink-primary">{student.group_name || '—'}</dd>
        </div>
      </dl>
      {isEditing && <PlacementForm student={student} onClose={() => setIsEditing(false)} />}
    </Card>
  )
}

// ---------------------------------------------------------------- Leave periods

const LeaveForm: React.FC<{ studentId: number; leave?: LeavePeriod; onClose: () => void }> = ({ studentId, leave, onClose }) => {
  const queryClient = useQueryClient()
  const [type, setType] = useState<LeaveType>(leave?.type ?? 'medical')
  const [status, setStatus] = useState<LeaveStatus>(leave?.status ?? 'pending')
  const [start, setStart] = useState(leave?.start_date ?? '')
  const [end, setEnd] = useState(leave?.end_date ?? '')
  const [reason, setReason] = useState(leave?.reason ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { student: studentId, type, status, start_date: start, end_date: end, reason: reason.trim() }
      return leave ? leavePeriodsService.update(leave.id, payload) : leavePeriodsService.create(payload)
    },
    onSuccess: () => {
      toast.success(leave ? 'Leave period updated' : 'Leave period recorded')
      queryClient.invalidateQueries({ queryKey: ['leave-periods', studentId] })
      queryClient.invalidateQueries({ queryKey: ['student', studentId] })
      onClose()
    },
    onError: (err) => {
      const info = parseApiError(err)
      setFieldErrors(info.fieldErrors)
      setFormError(Object.keys(info.fieldErrors).length ? null : info.message)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const errors: Record<string, string> = {}
    if (!start) errors.start_date = 'Start date is required'
    if (!end) errors.end_date = 'End date is required'
    if (start && end && end < start) errors.end_date = 'End date cannot be before the start date'
    setFieldErrors(errors)
    if (Object.keys(errors).length === 0) mutation.mutate()
  }

  return (
    <Modal title={leave ? 'Edit leave period' : 'Record leave period'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <LabeledSelect id="leave-type" label="Type" value={type} options={LEAVE_TYPE_OPTIONS} error={fieldErrors.type} onChange={(v) => setType(v as LeaveType)} />
        <Input label="Start date" type="date" required value={start} error={fieldErrors.start_date} onChange={(e) => setStart(e.target.value)} />
        <Input label="End date" type="date" required value={end} error={fieldErrors.end_date} onChange={(e) => setEnd(e.target.value)} />
        <LabeledSelect id="leave-status" label="Status" value={status} options={LEAVE_STATUS_OPTIONS} error={fieldErrors.status} onChange={(v) => setStatus(v as LeaveStatus)} />
        <TextArea id="leave-reason" label="Reason" value={reason} error={fieldErrors.reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const LeavePeriodsCard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<LeavePeriod | 'new' | null>(null)
  const [deleting, setDeleting] = useState<LeavePeriod | null>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leave-periods', studentId],
    queryFn: () => leavePeriodsService.list({ student: studentId }),
  })

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-ink-primary">Leave periods</h2>
        <Can tasks={['students.leave_periods.create']}>
          <Button size="sm" variant="secondary" onClick={() => setEditing('new')}>
            Record leave
          </Button>
        </Can>
      </div>
      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError error={error} />
      ) : data && data.results.length > 0 ? (
        <ul className="divide-y divide-surface-border">
          {data.results.map((leave) => (
            <li key={leave.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-ink-primary">
                  {optionLabel(LEAVE_TYPE_OPTIONS, leave.type)} · {leave.start_date} to {leave.end_date}
                </p>
                <p className="text-sm text-ink-muted">
                  {leave.reason || 'No reason recorded'}
                  {leave.counts_toward_graduation ? ' · counts toward graduation' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={LEAVE_VARIANT[leave.status]}>{optionLabel(LEAVE_STATUS_OPTIONS, leave.status)}</Badge>
                <Can tasks={['students.leave_periods.update']}>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(leave)} aria-label={`Edit leave from ${leave.start_date}`}>
                    Edit
                  </Button>
                </Can>
                <Can tasks={['students.leave_periods.delete']}>
                  <Button size="sm" variant="danger" onClick={() => setDeleting(leave)} aria-label={`Delete leave from ${leave.start_date}`}>
                    Delete
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="🗓️" title="No leave periods" description="No leave has been recorded for this student." />
      )}
      {editing && <LeaveForm studentId={studentId} leave={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete leave period"
          message={`Delete the leave from ${deleting.start_date} to ${deleting.end_date}?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await leavePeriodsService.remove(deleting.id)
            toast.success('Leave period deleted')
            queryClient.invalidateQueries({ queryKey: ['leave-periods', studentId] })
            queryClient.invalidateQueries({ queryKey: ['student', studentId] })
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Card>
  )
}

// --------------------------------------------------------------------- Finance

export const FinanceCard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student-finance', studentId],
    queryFn: () => studentsService.getFinanceSummary(studentId),
  })
  const format = (value: number | string) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const reasons = Array.isArray((data?.gating as { reasons?: unknown } | undefined)?.reasons)
    ? ((data?.gating as { reasons: string[] }).reasons ?? [])
    : []

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-ink-primary">Finance</h2>
        <Link className="text-sm text-primary-600 hover:underline" to="/finance/reports/statement">
          Open statement
        </Link>
      </div>
      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError error={error} />
      ) : data ? (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-ink-muted">Outstanding</dt>
              <dd className="text-ink-primary font-semibold">{format(data.outstanding)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Total charged</dt>
              <dd className="text-ink-primary">{format(data.total_debits)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Total paid / credited</dt>
              <dd className="text-ink-primary">{format(data.total_credits)}</dd>
            </div>
          </dl>
          {reasons.length > 0 && (
            <div className="mt-4">
              <Alert variant="warning" title="Restrictions">
                {reasons.join(' ')}
              </Alert>
            </div>
          )}
        </>
      ) : null}
    </Card>
  )
}

// --------------------------------------------------------------------- Results

const RESULT_VARIANT: Record<string, BadgeVariant> = { PUBLISHED: 'success', FROZEN: 'success', VERIFIED: 'info', DRAFT: 'warning' }

export const ResultsCard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student-results', studentId],
    queryFn: () => resultsService.getAll({ student: studentId }),
  })
  return (
    <Card>
      <h2 className="text-h4 text-ink-primary mb-4">Results</h2>
      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError error={error} />
      ) : data && data.results.length > 0 ? (
        <ul className="divide-y divide-surface-border">
          {data.results.map((result) => (
            <li key={result.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-ink-primary">{result.exam_title ?? `Exam ${result.exam}`}</p>
                <p className="text-sm text-ink-muted">
                  {result.total_obtained} / {result.total_max} · {result.final_outcome}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={RESULT_VARIANT[result.status] ?? 'default'}>{result.status}</Badge>
                <Link className="text-sm text-primary-600 hover:underline" to={`/results/${result.id}`}>
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📄" title="No results" description="No results have been recorded for this student." />
      )}
    </Card>
  )
}

// ------------------------------------------------------------------ Compliance

export const ComplianceCard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student-compliance', studentId],
    queryFn: () => complianceService.listRequirements({ student_id: studentId }),
  })
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-ink-primary">Compliance</h2>
        <Link className="text-sm text-primary-600 hover:underline" to="/compliance">
          Review queue
        </Link>
      </div>
      {isLoading ? (
        <SectionLoading />
      ) : isError ? (
        <SectionError error={error} />
      ) : data && data.results.length > 0 ? (
        <ul className="divide-y divide-surface-border">
          {data.results.map((requirement) => (
            <li key={requirement.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-ink-primary">{requirement.definition_title}</p>
                <p className="text-sm text-ink-muted">
                  {requirement.due_at ? `Due ${new Date(requirement.due_at).toLocaleDateString()}` : 'No due date'}
                </p>
              </div>
              <Badge variant={REQUIREMENT_VARIANT[requirement.status]}>{requirement.status}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="✅" title="No requirements" description="No compliance requirements are assigned to this student." />
      )}
    </Card>
  )
}
