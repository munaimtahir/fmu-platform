import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TextArea } from '@/components/ui/TextArea'
import { parseApiError } from '@/lib/apiErrors'
import { resultCorrectionsService } from '@/services/resultCorrections'
import type { ResultHeader } from '@/services/results'
import {
  buildProposedChanges,
  initialCorrectionForm,
  validateCorrectionForm,
  type CorrectionFormValues,
} from './correctionForm'

interface CorrectionRequestModalProps {
  result: ResultHeader
  onClose: () => void
  onCreated?: () => void
}

export const CorrectionRequestModal: React.FC<CorrectionRequestModalProps> = ({ result, onClose, onCreated }) => {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<CorrectionFormValues>(() => initialCorrectionForm(result))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      resultCorrectionsService.create({
        result_header: result.id,
        reason: values.reason.trim(),
        proposed_changes: buildProposedChanges(result, values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['result-corrections'] })
      toast.success('Correction request submitted')
      onCreated?.()
      onClose()
    },
    onError: (error) => {
      const info = parseApiError(error, 'Could not submit the correction request.')
      setErrors({
        ...(info.fieldErrors.reason ? { reason: info.fieldErrors.reason } : {}),
        ...(info.fieldErrors.proposed_changes ? { changes: info.fieldErrors.proposed_changes } : {}),
        ...(info.fieldErrors.result_header ? { result_header: info.fieldErrors.result_header } : {}),
      })
      setFormError(info.message)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const clientErrors = validateCorrectionForm(result, values)
    setErrors(clientErrors)
    setFormError(null)
    if (Object.keys(clientErrors).length === 0) mutation.mutate()
  }

  const entries = result.component_entries ?? []

  return (
    <Modal title="Request a result correction" size="lg" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-ink-secondary">
          Correction for <strong>{result.student_name ?? `student ${result.student}`}</strong>
          {result.exam_title ? ` - ${result.exam_title}` : ''}. Change only what is wrong; a reviewer must approve the
          request before anything changes.
        </p>
        {formError && <Alert variant="error">{formError}</Alert>}
        {errors.changes && <Alert variant="warning">{errors.changes}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Total obtained"
            inputMode="decimal"
            value={values.totalObtained}
            onChange={(e) => setValues((prev) => ({ ...prev, totalObtained: e.target.value }))}
            error={errors.total_obtained}
          />
          <Input
            label="Total maximum"
            inputMode="decimal"
            value={values.totalMax}
            onChange={(e) => setValues((prev) => ({ ...prev, totalMax: e.target.value }))}
            error={errors.total_max}
          />
        </div>

        {entries.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-ink-secondary">Component marks</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map((entry) => (
                <Input
                  key={entry.id}
                  label={`${entry.exam_component_name ?? `Component ${entry.exam_component}`} (max ${entry.exam_component_max_marks ?? '?'})`}
                  inputMode="decimal"
                  value={values.componentMarks[String(entry.id)] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      componentMarks: { ...prev.componentMarks, [String(entry.id)]: e.target.value },
                    }))
                  }
                  error={errors[`component_${entry.id}`]}
                />
              ))}
            </div>
          </fieldset>
        )}

        <TextArea
          id="correction-reason"
          label="Reason (required)"
          rows={3}
          value={values.reason}
          onChange={(e) => setValues((prev) => ({ ...prev, reason: e.target.value }))}
          error={errors.reason}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  )
}
