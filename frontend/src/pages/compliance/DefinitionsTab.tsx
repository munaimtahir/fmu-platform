import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { apiErrorMessage, parseApiError } from '@/lib/apiErrors'
import {
  REQUIREMENT_TYPE_OPTIONS,
  complianceService,
  type RequirementDefinition,
  type RequirementType,
} from '@/services/compliance'
import { StudentPicker } from './complianceUi'

const DefinitionForm: React.FC<{ definition?: RequirementDefinition; onClose: () => void }> = ({ definition, onClose }) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(definition?.title ?? '')
  const [description, setDescription] = useState(definition?.description ?? '')
  const [type, setType] = useState<RequirementType>(definition?.requirement_type ?? 'document')
  const [midSession, setMidSession] = useState(definition?.is_mid_session ?? false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { title: title.trim(), description: description.trim(), requirement_type: type, is_mid_session: midSession }
      return definition ? complianceService.updateDefinition(definition.id, payload) : complianceService.createDefinition(payload)
    },
    onSuccess: () => {
      toast.success(definition ? 'Definition updated' : 'Definition created')
      queryClient.invalidateQueries({ queryKey: ['compliance', 'definitions'] })
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
    if (!title.trim()) {
      setFieldErrors({ title: 'A title is required' })
      return
    }
    setFieldErrors({})
    mutation.mutate()
  }

  return (
    <Modal title={definition ? 'Edit requirement definition' : 'New requirement definition'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Title" required value={title} error={fieldErrors.title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
        <TextArea id="definition-description" label="Description" value={description} error={fieldErrors.description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <LabeledSelect id="definition-type" label="Type" value={type} options={REQUIREMENT_TYPE_OPTIONS} error={fieldErrors.requirement_type} onChange={(v) => setType(v as RequirementType)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={midSession} onChange={(e) => setMidSession(e.target.checked)} />
          Assigned mid-session
        </label>
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

export const DefinitionsTab: React.FC = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<RequirementDefinition | 'new' | null>(null)
  const [deleting, setDeleting] = useState<RequirementDefinition | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['compliance', 'definitions'],
    queryFn: () => complianceService.listDefinitions(),
  })

  if (isLoading) return <LoadingState message="Loading definitions..." />
  if (isError) return <ErrorState message={apiErrorMessage(error, 'Could not load definitions.')} onRetry={() => refetch()} />

  return (
    <Card>
      <div className="flex justify-end mb-4">
        <Can tasks={['compliance.definitions.create']}>
          <Button onClick={() => setEditing('new')}>New definition</Button>
        </Can>
      </div>
      {data && data.results.length > 0 ? (
        <ul className="divide-y divide-surface-border">
          {data.results.map((definition) => (
            <li key={definition.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-ink-primary">{definition.title}</p>
                {definition.description && <p className="text-sm text-ink-secondary">{definition.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{definition.requirement_type === 'document' ? 'Document' : 'Profile field'}</Badge>
                {definition.is_mid_session && <Badge variant="info">Mid-session</Badge>}
                <Can tasks={['compliance.definitions.update']}>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(definition)} aria-label={`Edit ${definition.title}`}>
                    Edit
                  </Button>
                </Can>
                <Can tasks={['compliance.definitions.delete']}>
                  <Button size="sm" variant="danger" onClick={() => setDeleting(definition)} aria-label={`Delete ${definition.title}`}>
                    Delete
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📋" title="No definitions" description="Create a requirement definition to assign to students." />
      )}
      {editing && <DefinitionForm definition={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete definition"
          message={`Delete "${deleting.title}"? Every student assignment of this requirement, with its submissions, will be deleted too.`}
          confirmLabel="Delete definition"
          variant="danger"
          onConfirm={async () => {
            await complianceService.deleteDefinition(deleting.id)
            toast.success('Definition deleted')
            queryClient.invalidateQueries({ queryKey: ['compliance'] })
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Card>
  )
}

interface AssignDialogProps {
  onClose: () => void
}

export const AssignDialog: React.FC<AssignDialogProps> = ({ onClose }) => {
  const queryClient = useQueryClient()
  const [definitionId, setDefinitionId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const { data: definitions } = useQuery({
    queryKey: ['compliance', 'definitions'],
    queryFn: () => complianceService.listDefinitions(),
  })

  const mutation = useMutation({
    mutationFn: () =>
      complianceService.assignToStudent({
        student_id: Number(studentId),
        definition_id: Number(definitionId),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success('Requirement assigned')
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      onClose()
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const errors: Record<string, string> = {}
    if (!definitionId) errors.definition = 'Choose a requirement'
    if (!studentId) errors.student = 'Choose a student'
    setFieldErrors(errors)
    if (Object.keys(errors).length === 0) mutation.mutate()
  }

  return (
    <Modal title="Assign requirement to student" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <LabeledSelect
          id="assign-definition"
          label="Requirement"
          required
          value={definitionId}
          placeholder="Select a requirement"
          options={(definitions?.results ?? []).map((d) => ({ value: d.id, label: d.title }))}
          error={fieldErrors.definition}
          onChange={setDefinitionId}
        />
        <StudentPicker id="assign-student" label="Student" required placeholder="Select a student" value={studentId} onChange={setStudentId} error={fieldErrors.student} />
        <Input label="Due date and time" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} helperText="Optional. Students are locked out 72 hours before this time." />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  )
}
