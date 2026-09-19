import type { Exam, ExamComponent, ExamComponentInput, ExamInput, PassingMode } from '@/services/exams'

export interface ExamFormValues {
  title: string
  examType: string
  academicPeriod: string
  department: string
  scheduledAt: string
  passingMode: PassingMode
  passTotalMarks: string
  passTotalPercent: string
  failIfAnyComponentFail: boolean
}

export interface ComponentFormValues {
  name: string
  sequence: string
  maxMarks: string
  passMarks: string
  passPercent: string
  isMandatoryToPass: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO timestamp -> value for `<input type="datetime-local">` (local time). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function emptyExamForm(): ExamFormValues {
  return {
    title: '',
    examType: '',
    academicPeriod: '',
    department: '',
    scheduledAt: '',
    passingMode: 'TOTAL_ONLY',
    passTotalMarks: '',
    passTotalPercent: '',
    failIfAnyComponentFail: false,
  }
}

export function examToForm(exam: Exam): ExamFormValues {
  return {
    title: exam.title,
    examType: exam.exam_type ?? '',
    academicPeriod: String(exam.academic_period),
    department: exam.department ? String(exam.department) : '',
    scheduledAt: toLocalInput(exam.scheduled_at),
    passingMode: exam.passing_mode,
    passTotalMarks: exam.pass_total_marks ?? '',
    passTotalPercent: exam.pass_total_percent ?? '',
    failIfAnyComponentFail: exam.fail_if_any_component_fail,
  }
}

function isNumber(text: string): boolean {
  return text.trim() !== '' && Number.isFinite(Number(text))
}

export function validateExamForm(values: ExamFormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.title.trim()) errors.title = 'Title is required.'
  if (!values.academicPeriod) errors.academic_period = 'Choose an academic period.'
  if (values.passTotalMarks.trim() !== '') {
    if (!isNumber(values.passTotalMarks) || Number(values.passTotalMarks) < 0) {
      errors.pass_total_marks = 'Enter zero or a positive number.'
    }
  }
  if (values.passTotalPercent.trim() !== '') {
    const pct = Number(values.passTotalPercent)
    if (!isNumber(values.passTotalPercent) || pct < 0 || pct > 100) {
      errors.pass_total_percent = 'Enter a percentage between 0 and 100.'
    }
  }
  return errors
}

export function examFormToInput(values: ExamFormValues): ExamInput {
  return {
    academic_period: Number(values.academicPeriod),
    department: values.department ? Number(values.department) : null,
    title: values.title.trim(),
    exam_type: values.examType.trim(),
    scheduled_at: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
    passing_mode: values.passingMode,
    pass_total_marks: values.passTotalMarks.trim() === '' ? null : values.passTotalMarks.trim(),
    pass_total_percent: values.passTotalPercent.trim() === '' ? null : values.passTotalPercent.trim(),
    fail_if_any_component_fail: values.failIfAnyComponentFail,
  }
}

export function emptyComponentForm(existing: ExamComponent[]): ComponentFormValues {
  const next = existing.reduce((max, c) => Math.max(max, c.sequence), 0) + 1
  return { name: '', sequence: String(next), maxMarks: '', passMarks: '', passPercent: '', isMandatoryToPass: false }
}

export function componentToForm(component: ExamComponent): ComponentFormValues {
  return {
    name: component.name,
    sequence: String(component.sequence),
    maxMarks: component.max_marks,
    passMarks: component.pass_marks ?? '',
    passPercent: component.pass_percent ?? '',
    isMandatoryToPass: component.is_mandatory_to_pass,
  }
}

export function validateComponentForm(
  values: ComponentFormValues,
  existing: ExamComponent[],
  editingId?: number
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.name.trim()) errors.name = 'Name is required.'

  const sequence = Number(values.sequence)
  if (!Number.isInteger(sequence) || sequence < 1) {
    errors.sequence = 'Sequence must be a whole number of 1 or more.'
  } else if (existing.some((c) => c.sequence === sequence && c.id !== editingId)) {
    errors.sequence = `Sequence ${sequence} is already used by another component.`
  }

  const max = Number(values.maxMarks)
  if (!isNumber(values.maxMarks) || max <= 0) {
    errors.max_marks = 'Maximum marks must be greater than zero.'
  }
  if (values.passMarks.trim() !== '') {
    const pass = Number(values.passMarks)
    if (!isNumber(values.passMarks) || pass < 0) {
      errors.pass_marks = 'Enter zero or a positive number.'
    } else if (isNumber(values.maxMarks) && pass > max) {
      errors.pass_marks = 'Pass marks cannot exceed the maximum marks.'
    }
  }
  if (values.passPercent.trim() !== '') {
    const pct = Number(values.passPercent)
    if (!isNumber(values.passPercent) || pct < 0 || pct > 100) {
      errors.pass_percent = 'Enter a percentage between 0 and 100.'
    }
  }
  return errors
}

export function componentFormToInput(examId: number, values: ComponentFormValues): ExamComponentInput {
  return {
    exam: examId,
    name: values.name.trim(),
    sequence: Number(values.sequence),
    max_marks: values.maxMarks.trim(),
    pass_marks: values.passMarks.trim() === '' ? null : values.passMarks.trim(),
    pass_percent: values.passPercent.trim() === '' ? null : values.passPercent.trim(),
    is_mandatory_to_pass: values.isMandatoryToPass,
  }
}
