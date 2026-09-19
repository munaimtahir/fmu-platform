import type { ResultHeader } from '@/services/results'
import type { ProposedChanges } from '@/services/resultCorrections'

export interface CorrectionFormValues {
  reason: string
  totalObtained: string
  totalMax: string
  /** Component entry id -> marks text. */
  componentMarks: Record<string, string>
}

export function initialCorrectionForm(result: ResultHeader): CorrectionFormValues {
  const componentMarks: Record<string, string> = {}
  for (const entry of result.component_entries ?? []) {
    componentMarks[String(entry.id)] = String(entry.marks_obtained)
  }
  return {
    reason: '',
    totalObtained: String(result.total_obtained),
    totalMax: String(result.total_max),
    componentMarks,
  }
}

const sameNumber = (a: string, b: string | number) => Number(a) === Number(b)

/** Only the fields the requester actually changed are proposed. */
export function buildProposedChanges(result: ResultHeader, values: CorrectionFormValues): ProposedChanges {
  const changes: ProposedChanges = {}
  if (values.totalObtained.trim() !== '' && !sameNumber(values.totalObtained, result.total_obtained)) {
    changes.total_obtained = values.totalObtained.trim()
  }
  if (values.totalMax.trim() !== '' && !sameNumber(values.totalMax, result.total_max)) {
    changes.total_max = values.totalMax.trim()
  }
  const marks: Record<string, string> = {}
  for (const entry of result.component_entries ?? []) {
    const next = values.componentMarks[String(entry.id)]
    if (next !== undefined && next.trim() !== '' && !sameNumber(next, entry.marks_obtained)) {
      marks[String(entry.id)] = next.trim()
    }
  }
  if (Object.keys(marks).length > 0) changes.component_marks = marks
  return changes
}

function invalidNumber(text: string): boolean {
  return text.trim() === '' || !Number.isFinite(Number(text)) || Number(text) < 0
}

/** Field-keyed errors; component fields are keyed `component_<entryId>`. */
export function validateCorrectionForm(result: ResultHeader, values: CorrectionFormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.reason.trim()) errors.reason = 'Explain why this result needs correcting.'
  if (invalidNumber(values.totalObtained)) errors.total_obtained = 'Enter zero or a positive number.'
  if (invalidNumber(values.totalMax)) errors.total_max = 'Enter zero or a positive number.'

  for (const entry of result.component_entries ?? []) {
    const text = values.componentMarks[String(entry.id)] ?? ''
    const key = `component_${entry.id}`
    if (invalidNumber(text)) {
      errors[key] = 'Enter zero or a positive number.'
      continue
    }
    const max = Number(entry.exam_component_max_marks)
    if (Number.isFinite(max) && max > 0 && Number(text) > max) {
      errors[key] = `Cannot exceed the maximum of ${max}.`
    }
  }

  if (Object.keys(errors).length === 0 && Object.keys(buildProposedChanges(result, values)).length === 0) {
    errors.changes = 'Change at least one mark or total.'
  }
  return errors
}
