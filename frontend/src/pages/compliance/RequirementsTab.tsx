import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { apiErrorMessage } from '@/lib/apiErrors'
import { REQUIREMENT_STATUS_OPTIONS, complianceService, type RequirementInstance, type RequirementStatus } from '@/services/compliance'
import { RequirementStatusBadge, StudentLabel, StudentPicker, SubmissionHistory, formatDateTime } from './complianceUi'

type Decision = { kind: 'verify' | 'reject'; requirement: RequirementInstance }

const RequirementRow: React.FC<{ requirement: RequirementInstance; onDecide: (decision: Decision) => void }> = ({ requirement, onDecide }) => {
  const [showHistory, setShowHistory] = useState(false)
  const reviewable = requirement.status === 'submitted'
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink-primary">{requirement.definition_title}</p>
          <p className="text-sm text-ink-secondary">
            <StudentLabel studentId={requirement.student} /> · due {formatDateTime(requirement.due_at)}
          </p>
          {requirement.notes && <p className="text-sm text-ink-muted mt-1">Note: {requirement.notes}</p>}
        </div>
        <div className="flex items-center gap-2">
          <RequirementStatusBadge status={requirement.status} />
          <Button size="sm" variant="ghost" onClick={() => setShowHistory((open) => !open)} aria-expanded={showHistory}>
            {showHistory ? 'Hide submissions' : `Submissions (${requirement.submissions.length})`}
          </Button>
          {reviewable && (
            <Can tasks={['compliance.requirements.review']}>
              <Button size="sm" onClick={() => onDecide({ kind: 'verify', requirement })} aria-label={`Verify ${requirement.definition_title}`}>
                Verify
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDecide({ kind: 'reject', requirement })} aria-label={`Reject ${requirement.definition_title}`}>
                Reject
              </Button>
            </Can>
          )}
        </div>
      </div>
      {showHistory && (
        <div className="mt-3 pl-4 border-l-2 border-surface-border">
          <SubmissionHistory submissions={requirement.submissions} />
        </div>
      )}
    </li>
  )
}

const DecisionDialog: React.FC<{ decision: Decision; onClose: () => void }> = ({ decision, onClose }) => {
  const queryClient = useQueryClient()
  const { kind, requirement } = decision
  const verb = kind === 'verify' ? 'Verify' : 'Reject'
  return (
    <ConfirmDialog
      title={`${verb} requirement`}
      message={
        kind === 'verify'
          ? `Mark "${requirement.definition_title}" as verified? The student will see it as complete.`
          : `Reject "${requirement.definition_title}"? The student will see your note and be asked to submit again.`
      }
      confirmLabel={verb}
      variant={kind === 'reject' ? 'danger' : 'primary'}
      requireReason
      reasonLabel="Notes for the student"
      onConfirm={async (notes) => {
        if (kind === 'verify') await complianceService.verify(requirement.id, notes ?? '')
        else await complianceService.reject(requirement.id, notes ?? '')
        toast.success(kind === 'verify' ? 'Requirement verified' : 'Requirement rejected')
        queryClient.invalidateQueries({ queryKey: ['compliance'] })
      }}
      onClose={onClose}
    />
  )
}

export const ReviewQueueTab: React.FC = () => {
  const [decision, setDecision] = useState<Decision | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['compliance', 'review-queue'],
    queryFn: () => complianceService.reviewQueue(),
  })

  if (isLoading) return <LoadingState message="Loading review queue..." />
  if (isError) return <ErrorState message={apiErrorMessage(error, 'Could not load the review queue.')} onRetry={() => refetch()} />

  return (
    <Card>
      {data && data.length > 0 ? (
        <ul className="divide-y divide-surface-border">
          {data.map((requirement) => (
            <RequirementRow key={requirement.id} requirement={requirement} onDecide={setDecision} />
          ))}
        </ul>
      ) : (
        <EmptyState icon="🎉" title="Nothing to review" description="No submissions are waiting for review." />
      )}
      {decision && <DecisionDialog decision={decision} onClose={() => setDecision(null)} />}
    </Card>
  )
}

export const AllRequirementsTab: React.FC = () => {
  const [status, setStatus] = useState<RequirementStatus | ''>('')
  const [studentId, setStudentId] = useState('')
  const [page, setPage] = useState(1)
  const [decision, setDecision] = useState<Decision | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['compliance', 'requirements', status, studentId, page],
    queryFn: () =>
      complianceService.listRequirements({
        status: status || undefined,
        student_id: studentId ? Number(studentId) : undefined,
        page,
      }),
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledSelect
            id="requirements-status-filter"
            label="Status"
            value={status}
            placeholder="All statuses"
            options={REQUIREMENT_STATUS_OPTIONS}
            onChange={(value) => {
              setStatus(value as RequirementStatus | '')
              setPage(1)
            }}
          />
          <StudentPicker
            id="requirements-student-filter"
            label="Student"
            value={studentId}
            onChange={(value) => {
              setStudentId(value)
              setPage(1)
            }}
          />
        </div>
      </Card>
      {isLoading ? (
        <LoadingState message="Loading requirements..." />
      ) : isError ? (
        <ErrorState message={apiErrorMessage(error, 'Could not load requirements.')} onRetry={() => refetch()} />
      ) : (
        <Card>
          {data && data.results.length > 0 ? (
            <>
              <ul className="divide-y divide-surface-border">
                {data.results.map((requirement) => (
                  <RequirementRow key={requirement.id} requirement={requirement} onDecide={setDecision} />
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-ink-muted">{data.count} total</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={!data.previous} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState icon="📭" title="No requirements found" description="Try a different filter." />
          )}
        </Card>
      )}
      {decision && <DecisionDialog decision={decision} onClose={() => setDecision(null)} />}
    </div>
  )
}
