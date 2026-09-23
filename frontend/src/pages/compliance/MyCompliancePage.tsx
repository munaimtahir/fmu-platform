import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileUpload } from '@/components/ui/FileUpload'
import { parseApiError, apiErrorMessage } from '@/lib/apiErrors'
import {
  REQUIREMENT_STATUS_OPTIONS,
  canSubmitRequirement,
  complianceService,
  type RequirementInstance,
  type RequirementStatus,
} from '@/services/compliance'
import { RequirementStatusBadge, SubmissionHistory, formatDateTime } from './complianceUi'

const MAX_FILE_BYTES = 10 * 1024 * 1024

const SubmitDialog: React.FC<{ requirement: RequirementInstance; onClose: () => void }> = ({ requirement, onClose }) => {
  const queryClient = useQueryClient()
  const [value, setValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: () => complianceService.submit(requirement.id, { value, file }),
    onSuccess: () => {
      toast.success('Submitted for review')
      queryClient.invalidateQueries({ queryKey: ['my-compliance'] })
      onClose()
    },
    onError: (err) => {
      const info = parseApiError(err)
      setFileError(info.fieldErrors.file)
      setError(info.message)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!value.trim() && !file) {
      setError('Enter a value or attach a file.')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title={`Submit: ${requirement.definition_title}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        {requirement.status === 'rejected' && requirement.notes && (
          <Alert variant="warning" title="Previously rejected">
            {requirement.notes}
          </Alert>
        )}
        <Input label="Value" value={value} maxLength={255} onChange={(e) => setValue(e.target.value)} helperText="Text answer, reference number or note (optional if you attach a file)." />
        <FileUpload
          id="compliance-file"
          label="Document"
          accept="application/pdf,image/*"
          maxSize={MAX_FILE_BYTES}
          error={fileError}
          onChange={(files) => setFile(files?.[0] ?? null)}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const RequirementCard: React.FC<{ requirement: RequirementInstance; onSubmit: () => void }> = ({ requirement, onSubmit }) => {
  const submittable = canSubmitRequirement(requirement)
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h4 text-ink-primary">{requirement.definition_title}</h2>
          {requirement.definition_description && <p className="text-sm text-ink-secondary mt-1">{requirement.definition_description}</p>}
        </div>
        <RequirementStatusBadge status={requirement.status} />
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-ink-muted">Due</dt>
          <dd className="text-ink-primary">{formatDateTime(requirement.due_at)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Type</dt>
          <dd className="text-ink-primary">{requirement.definition_type === 'document' ? 'Document' : 'Profile field'}</dd>
        </div>
        {requirement.completed_at && (
          <div>
            <dt className="text-ink-muted">Verified on</dt>
            <dd className="text-ink-primary">{formatDateTime(requirement.completed_at)}</dd>
          </div>
        )}
      </dl>

      {requirement.status === 'rejected' && (
        <div className="mt-4">
          <Alert variant="error" title="Rejected">
            {requirement.notes || 'This submission was rejected. Please submit it again.'}
          </Alert>
        </div>
      )}
      {requirement.status !== 'rejected' && requirement.notes && (
        <p className="mt-4 text-sm text-ink-secondary">
          <span className="font-medium">Registrar note:</span> {requirement.notes}
        </p>
      )}
      {requirement.is_locked && (
        <div className="mt-4">
          <Alert variant="warning" title="Locked">
            This requirement is within 72 hours of its due date and is locked. Please contact the Registrar to submit it.
          </Alert>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-medium text-ink-primary mb-2">Submission history</h3>
        <SubmissionHistory requirementId={requirement.id} submissions={requirement.submissions} />
      </div>

      <div className="mt-4 flex justify-end">
        {requirement.status === 'verified' ? (
          <span className="text-sm text-ink-muted">Verified — nothing more to do.</span>
        ) : (
          <Button onClick={onSubmit} disabled={!submittable} aria-label={`Submit ${requirement.definition_title}`}>
            {requirement.status === 'pending' ? 'Submit' : 'Submit again'}
          </Button>
        )}
      </div>
    </Card>
  )
}

export const MyCompliancePage: React.FC = () => {
  const [filter, setFilter] = useState<RequirementStatus | ''>('')
  const [submitting, setSubmitting] = useState<RequirementInstance | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-compliance'],
    queryFn: () => complianceService.listMine(),
  })

  if (isLoading) return <LoadingState message="Loading your requirements..." />
  if (isError) return <ErrorState message={apiErrorMessage(error, 'Could not load your requirements.')} onRetry={() => refetch()} />

  const requirements = (data ?? []).filter((requirement) => !filter || requirement.status === filter)
  const open = (data ?? []).filter((requirement) => requirement.status === 'pending' || requirement.status === 'rejected').length

  return (
    <PageShell
      title="My Compliance"
      description={open > 0 ? `${open} requirement${open === 1 ? '' : 's'} need your attention.` : 'Documents and information the college needs from you.'}
    >
      <div className="max-w-xs mb-4">
        <LabeledSelect
          id="compliance-status-filter"
          label="Show"
          value={filter}
          placeholder="All requirements"
          options={REQUIREMENT_STATUS_OPTIONS}
          onChange={(value) => setFilter(value as RequirementStatus | '')}
        />
      </div>
      {requirements.length === 0 ? (
        <EmptyState icon="✅" title="No requirements" description={filter ? 'No requirements match this filter.' : 'You have no compliance requirements assigned.'} />
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <RequirementCard key={requirement.id} requirement={requirement} onSubmit={() => setSubmitting(requirement)} />
          ))}
        </div>
      )}
      {submitting && <SubmitDialog requirement={submitting} onClose={() => setSubmitting(null)} />}
    </PageShell>
  )
}
