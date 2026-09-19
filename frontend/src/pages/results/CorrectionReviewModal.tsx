import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextArea } from '@/components/ui/TextArea'
import { Can } from '@/components/shared/Can'
import { apiErrorMessage } from '@/lib/apiErrors'
import {
  CORRECTION_STATUS_LABELS,
  resultCorrectionsService,
  type CorrectionDecision,
  type ResultCorrection,
} from '@/services/resultCorrections'

interface Change {
  label: string
  from: string
  to: string
}

/** Original -> proposed rows for the totals and each component entry. */
export function describeChanges(correction: ResultCorrection): Change[] {
  const { proposed_changes: proposed, original_values: original } = correction
  const rows: Change[] = []
  if (proposed.total_obtained !== undefined) {
    rows.push({ label: 'Total obtained', from: String(original.total_obtained ?? '-'), to: String(proposed.total_obtained) })
  }
  if (proposed.total_max !== undefined) {
    rows.push({ label: 'Total maximum', from: String(original.total_max ?? '-'), to: String(proposed.total_max) })
  }
  for (const [entryId, marks] of Object.entries(proposed.component_marks ?? {})) {
    rows.push({
      label: `Component entry ${entryId}`,
      from: String(original.component_marks?.[entryId] ?? '-'),
      to: String(marks),
    })
  }
  return rows
}

interface CorrectionReviewModalProps {
  correction: ResultCorrection
  onClose: () => void
}

export const CorrectionReviewModal: React.FC<CorrectionReviewModalProps> = ({ correction, onClose }) => {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<CorrectionDecision | null>(null)

  const mutation = useMutation({
    mutationFn: (decision: CorrectionDecision) => resultCorrectionsService.review(correction.id, decision, note.trim()),
    onSuccess: (_updated, decision) => {
      queryClient.invalidateQueries({ queryKey: ['result-corrections'] })
      toast.success(decision === 'APPROVED' ? 'Correction approved' : 'Correction rejected')
      onClose()
    },
    onError: (err) => {
      setConfirming(null)
      setError(apiErrorMessage(err, 'Could not record the decision.'))
    },
  })

  const changes = describeChanges(correction)
  const pending = correction.status === 'PENDING'

  const choose = (decision: CorrectionDecision) => {
    if (decision === 'REJECTED' && !note.trim()) {
      setError('Add a note explaining the rejection.')
      return
    }
    setError(null)
    setConfirming(decision)
  }

  return (
    <Modal title={`Correction request #${correction.id}`} size="lg" onClose={onClose}>
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-secondary">Status</dt>
            <dd className="font-medium">{CORRECTION_STATUS_LABELS[correction.status]}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">Requested by</dt>
            <dd className="font-medium">{correction.requested_by_username ?? correction.requested_by}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ink-secondary">Reason</dt>
            <dd>{correction.reason}</dd>
          </div>
          {correction.review_note && (
            <div className="col-span-2">
              <dt className="text-ink-secondary">Review note</dt>
              <dd>{correction.review_note}</dd>
            </div>
          )}
        </dl>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-secondary border-b">
              <th className="py-2 pr-3">Field</th>
              <th className="py-2 pr-3">Current</th>
              <th className="py-2">Proposed</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.label} className="border-b last:border-0">
                <td className="py-2 pr-3">{change.label}</td>
                <td className="py-2 pr-3">{change.from}</td>
                <td className="py-2 font-medium">{change.to}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <Alert variant="error">{error}</Alert>}

        {pending && (
          <Can tasks={['results.result_corrections.review']}>
            <div className="space-y-3 border-t pt-4">
              <TextArea
                id="review-note"
                label="Review note (required to reject)"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="danger" onClick={() => choose('REJECTED')} disabled={mutation.isPending}>
                  Reject
                </Button>
                <Button onClick={() => choose('APPROVED')} disabled={mutation.isPending}>
                  Approve
                </Button>
              </div>
            </div>
          </Can>
        )}

        {confirming && (
          <Alert variant="warning" title={`Confirm ${confirming === 'APPROVED' ? 'approval' : 'rejection'}`}>
            <p className="mb-3">
              {confirming === 'APPROVED'
                ? 'Approving lets an authorised user apply these changes to the published result.'
                : 'Rejecting closes this request without changing the result.'}
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant={confirming === 'REJECTED' ? 'danger' : 'primary'}
                isLoading={mutation.isPending}
                onClick={() => mutation.mutate(confirming)}
              >
                Yes, {confirming === 'APPROVED' ? 'approve' : 'reject'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(null)} disabled={mutation.isPending}>
                Go back
              </Button>
            </div>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
