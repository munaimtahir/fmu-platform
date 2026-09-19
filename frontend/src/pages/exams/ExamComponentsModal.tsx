import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { parseApiError } from '@/lib/apiErrors'
import { examsService, type Exam, type ExamComponent } from '@/services/exams'
import {
  componentFormToInput,
  componentToForm,
  emptyComponentForm,
  validateComponentForm,
  type ComponentFormValues,
} from './examForm'

interface ExamComponentsModalProps {
  exam: Exam
  onClose: () => void
}

export const ExamComponentsModal: React.FC<ExamComponentsModalProps> = ({ exam, onClose }) => {
  const queryClient = useQueryClient()
  const key = ['exam-components', exam.id]

  const components = useQuery({ queryKey: key, queryFn: () => examsService.getComponents(exam.id) })
  const list: ExamComponent[] = components.data?.results ?? []

  // `null` = form hidden, `'new'` = adding, otherwise editing that component.
  const [editing, setEditing] = useState<ExamComponent | 'new' | null>(null)
  const [values, setValues] = useState<ComponentFormValues>(emptyComponentForm([]))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ExamComponent | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key })
    queryClient.invalidateQueries({ queryKey: ['exams'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = componentFormToInput(exam.id, values)
      return editing && editing !== 'new'
        ? examsService.updateComponent(editing.id, payload)
        : examsService.createComponent(payload)
    },
    onSuccess: () => {
      refresh()
      toast.success(editing === 'new' ? 'Component added' : 'Component updated')
      setEditing(null)
    },
    onError: (error) => {
      const info = parseApiError(error, 'Could not save the component.')
      setErrors(info.fieldErrors)
      setFormError(info.message)
    },
  })

  const startNew = () => {
    setValues(emptyComponentForm(list))
    setErrors({})
    setFormError(null)
    setEditing('new')
  }

  const startEdit = (component: ExamComponent) => {
    setValues(componentToForm(component))
    setErrors({})
    setFormError(null)
    setEditing(component)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const clientErrors = validateComponentForm(values, list, editing && editing !== 'new' ? editing.id : undefined)
    setErrors(clientErrors)
    setFormError(null)
    if (Object.keys(clientErrors).length === 0) saveMutation.mutate()
  }

  const set = <K extends keyof ComponentFormValues>(field: K, value: ComponentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }))

  const totalMax = list.reduce((sum, c) => sum + Number(c.max_marks), 0)

  return (
    <Modal title={`Components: ${exam.title}`} size="lg" onClose={onClose}>
      <div className="space-y-4">
        {exam.published && (
          <Alert variant="warning">
            This exam is published. Changing its components affects how results are computed.
          </Alert>
        )}

        {components.isLoading && <LoadingState message="Loading components..." />}
        {components.error && (
          <ErrorState message="Failed to load components" onRetry={() => components.refetch()} />
        )}

        {!components.isLoading && !components.error && (
          <>
            {list.length === 0 ? (
              <p className="text-sm text-ink-secondary">No components yet. Add the first one below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-secondary border-b">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Max</th>
                      <th className="py-2 pr-3">Pass marks</th>
                      <th className="py-2 pr-3">Pass %</th>
                      <th className="py-2 pr-3">Must pass</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((component) => (
                      <tr key={component.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{component.sequence}</td>
                        <td className="py-2 pr-3 font-medium">{component.name}</td>
                        <td className="py-2 pr-3">{component.max_marks}</td>
                        <td className="py-2 pr-3">{component.pass_marks ?? '-'}</td>
                        <td className="py-2 pr-3">{component.pass_percent ?? '-'}</td>
                        <td className="py-2 pr-3">
                          {component.is_mandatory_to_pass ? <Badge variant="warning">Required</Badge> : '-'}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Can tasks={['exams.components.update']}>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(component)}>
                                Edit
                              </Button>
                            </Can>
                            <Can tasks={['exams.components.delete']}>
                              <Button size="sm" variant="danger" onClick={() => setDeleting(component)}>
                                Delete
                              </Button>
                            </Can>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-sm text-ink-secondary">Total maximum marks: {totalMax}</p>
              </div>
            )}

            {editing === null ? (
              <Can tasks={['exams.components.create']}>
                <Button onClick={startNew}>Add component</Button>
              </Can>
            ) : (
              <form onSubmit={submit} className="space-y-3 border rounded-2xl p-4" noValidate>
                <h3 className="text-h4">{editing === 'new' ? 'Add component' : `Edit ${editing.name}`}</h3>
                {formError && <Alert variant="error">{formError}</Alert>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    required
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={errors.name}
                  />
                  <Input
                    label="Sequence"
                    inputMode="numeric"
                    value={values.sequence}
                    onChange={(e) => set('sequence', e.target.value)}
                    error={errors.sequence}
                  />
                  <Input
                    label="Maximum marks"
                    required
                    inputMode="decimal"
                    value={values.maxMarks}
                    onChange={(e) => set('maxMarks', e.target.value)}
                    error={errors.max_marks}
                  />
                  <Input
                    label="Pass marks"
                    inputMode="decimal"
                    value={values.passMarks}
                    onChange={(e) => set('passMarks', e.target.value)}
                    error={errors.pass_marks}
                  />
                  <Input
                    label="Pass %"
                    inputMode="decimal"
                    value={values.passPercent}
                    onChange={(e) => set('passPercent', e.target.value)}
                    error={errors.pass_percent}
                  />
                </div>
                <Switch
                  id="component-mandatory"
                  label="Must pass this component"
                  checked={values.isMandatoryToPass}
                  onChange={(checked) => set('isMandatoryToPass', checked)}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={saveMutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={saveMutation.isPending}>
                    {editing === 'new' ? 'Add component' : 'Save component'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete component"
          variant="danger"
          confirmLabel="Delete component"
          message={
            <>
              Delete <strong>{deleting.name}</strong> from {exam.title}? Components that already have recorded
              marks cannot be deleted.
            </>
          }
          onConfirm={async () => {
            await examsService.removeComponent(deleting.id)
            refresh()
            toast.success('Component deleted')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Modal>
  )
}
