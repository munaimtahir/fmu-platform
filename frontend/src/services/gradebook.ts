/**
 * Gradebook service: draft component-mark entry.
 *
 * Backend: /api/result-components/ (ResultComponentEntryViewSet; tasks results.result_components.*),
 * /api/results/ for the result header, /api/academics/sections/ and /api/students/ for eligibility.
 * Faculty are scoped server-side to groups/periods they teach; the backend rejects anything else
 * with RESULT_SCOPE_DENIED.
 */
import api from '@/api/axios'
import type { Paginated } from '@/lib/pagination'
import { resultsService, type ResultComponent, type ResultHeader } from './results'

export interface GradebookSection {
  id: number
  name: string
  course_name?: string
  academic_period: number
  group: number
  group_name?: string
  faculty: number | null
}

export interface GradebookStudent {
  id: number
  reg_no: string
  name: string
  group: number
  group_name?: string
}

export interface EntryInput {
  result_header: number
  exam_component: number
  marks_obtained: string
}

/** Client-side mirror of the marks rules; the backend does not check the component maximum. */
export function validateMarks(raw: string, maxMarks: number): string | null {
  const text = raw.trim()
  if (text === '') return 'Enter the marks obtained.'
  const value = Number(text)
  if (!Number.isFinite(value)) return 'Marks must be a number.'
  if (value < 0) return 'Marks cannot be negative.'
  if (value > maxMarks) return `Marks cannot exceed the maximum of ${maxMarks}.`
  if (Math.round(value * 100) / 100 !== value) return 'Use at most two decimal places.'
  return null
}

/** Totals to store on the header: marks entered so far over the full paper maximum. */
export function computeTotals(
  entries: Array<{ marks_obtained: string | number }>,
  components: Array<{ max_marks: string | number }>
): { total_obtained: string; total_max: string } {
  const obtained = entries.reduce((sum, entry) => sum + Number(entry.marks_obtained || 0), 0)
  const max = components.reduce((sum, component) => sum + Number(component.max_marks || 0), 0)
  return { total_obtained: obtained.toFixed(2), total_max: max.toFixed(2) }
}

export const gradebookService = {
  async listEntries(params: { result_header?: number; exam_component?: number; page?: number }): Promise<Paginated<ResultComponent>> {
    const response = await api.get<Paginated<ResultComponent>>('/api/result-components/', { params })
    return response.data
  },

  async createEntry(data: EntryInput): Promise<ResultComponent> {
    const response = await api.post<ResultComponent>('/api/result-components/', data)
    return response.data
  },

  async updateEntry(id: number, data: { marks_obtained: string }): Promise<ResultComponent> {
    const response = await api.patch<ResultComponent>(`/api/result-components/${id}/`, data)
    return response.data
  },

  async deleteEntry(id: number): Promise<void> {
    await api.delete(`/api/result-components/${id}/`)
  },

  /** The result header for one student and exam, if a draft has been started. */
  async findHeader(examId: number, studentId: number): Promise<ResultHeader | null> {
    const page = await resultsService.getAll({ exam: examId, student: studentId })
    return page.results[0] ?? null
  },

  async startHeader(examId: number, studentId: number): Promise<ResultHeader> {
    return resultsService.create({ exam: examId, student: studentId })
  },

  /** Store recomputed totals so the backend recomputes the outcome (it does not derive totals itself). */
  async syncTotals(headerId: number, totals: { total_obtained: string; total_max: string }): Promise<ResultHeader> {
    return resultsService.update(headerId, totals)
  },

  /** Sections in an academic period; pass `faculty` to limit to one teacher's sections. */
  async getSections(params: { academic_period: number; faculty?: number }): Promise<GradebookSection[]> {
    const response = await api.get<Paginated<GradebookSection>>('/api/academics/sections/', { params })
    return response.data.results
  },

  async searchStudents(params: { search?: string; group?: number; page?: number }): Promise<Paginated<GradebookStudent>> {
    const response = await api.get<Paginated<GradebookStudent>>('/api/students/', { params })
    return response.data
  },
}
