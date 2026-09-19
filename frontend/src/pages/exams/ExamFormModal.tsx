import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { parseApiError } from '@/lib/apiErrors'
import { examsService, PASSING_MODE_LABELS, type Exam, type PassingMode } from '@/services/exams'
import { emptyExamForm, examFormToInput, examToForm, validateExamForm, type ExamFormValues } from './examForm'

interface ExamFormModalProps {
  exam?: Exam | null
  onClose: () => void
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({ exam, onClose }) => {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ExamFormValues>(() => (exam ? examToForm(exam) : emptyExamForm()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const periods = useQuery({ queryKey: ['exam-form-periods'], queryFn: () => examsService.getAcademicPeriods() })
  const departments = useQuery({ queryKey: ['exam-form-departments'], queryFn: () => examsService.getDepartments() })

  const mutation = useMutation({
    mutationFn: () => {
      const payload = examFormToInput(values)
      return exam ? examsService.update(exam.id, payload) : examsService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success(exam ? 'Exam updated' : 'Exam created')
      onClose()
    },
    onError: (error) => {
      const info = parseApiError(error, 'Could not save the exam.')
      setErrors(info.fieldErrors)
      setFormError(info.message)
    },
  })

  const set = <K extends keyof ExamFormValues>(key: K, value: ExamFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const clientErrors = validateExamForm(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      setFormError(null)
      return
    }
    setFormError(null)
    mutation.mutate()
  }

  const periodOptions = (periods.data ?? []).map((p) => ({ value: String(p.id), label: p.name }))
  const departmentOptions = [
    { value: '', label: 'No department (combined exam)' },
    ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
  ]
  const modeOptions = (Object.keys(PASSING_MODE_LABELS) as PassingMode[]).map((mode) => ({
    value: mode,
    label: PASSING_MODE_LABELS[mode],
  }))

  return (
    <Modal title={exam ? 'Edit exam' : 'New exam'} size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <Input
          label="Title"
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Exam type"
            placeholder="Midterm, Final, Quiz..."
            value={values.examType}
            onChange={(e) => set('examType', e.target.value)}
            error={errors.exam_type}
          />
          <Input
            label="Scheduled at"
            type="datetime-local"
            value={values.scheduledAt}
            onChange={(e) => set('scheduledAt', e.target.value)}
            error={errors.scheduled_at}
          />
          <Select
            label="Academic period"
            required
            options={periodOptions}
            value={values.academicPeriod}
            onChange={(v) => set('academicPeriod', v)}
            error={errors.academic_period}
          />
          <Select
            label="Department"
            options={departmentOptions}
            value={values.department}
            onChange={(v) => set('department', v)}
            error={errors.department}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Passing mode"
            options={modeOptions}
            value={values.passingMode}
            onChange={(v) => set('passingMode', v as PassingMode)}
            error={errors.passing_mode}
          />
          <Input
            label="Pass total marks"
            inputMode="decimal"
            value={values.passTotalMarks}
            onChange={(e) => set('passTotalMarks', e.target.value)}
            error={errors.pass_total_marks}
          />
          <Input
            label="Pass total %"
            inputMode="decimal"
            value={values.passTotalPercent}
            onChange={(e) => set('passTotalPercent', e.target.value)}
            error={errors.pass_total_percent}
          />
        </div>
        <Switch
          id="fail-if-any-component"
          label="Fail if any mandatory component fails"
          checked={values.failIfAnyComponentFail}
          onChange={(checked) => set('failIfAnyComponentFail', checked)}
          error={errors.fail_if_any_component_fail}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {exam ? 'Save changes' : 'Create exam'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
