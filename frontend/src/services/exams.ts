/**
 * Exams API service
 *
 * Backend endpoints: /api/exams/ (ExamViewSet), /api/exam-components/ (ExamComponentViewSet).
 * Task codes: exams.exams.{view,create,update,delete,publish}, exams.components.{view,create,update,delete}.
 */
import api from '@/api/axios'
import { resultsOf, type Paginated } from '@/lib/pagination'

export type PassingMode = 'TOTAL_ONLY' | 'COMPONENT_WISE' | 'HYBRID'

export const PASSING_MODE_LABELS: Record<PassingMode, string> = {
  TOTAL_ONLY: 'Total only',
  COMPONENT_WISE: 'Component wise',
  HYBRID: 'Hybrid',
}

export interface ExamComponent {
  id: number
  exam: number
  name: string
  sequence: number
  department: number | null
  department_name?: string
  max_marks: string
  pass_marks: string | null
  pass_percent: string | null
  is_mandatory_to_pass: boolean
  created_at?: string
  updated_at?: string
}

export interface Exam {
  id: number
  academic_period: number
  academic_period_name?: string
  department: number | null
  department_name?: string
  title: string
  exam_type: string
  scheduled_at: string | null
  published: boolean
  version: number
  passing_mode: PassingMode
  pass_total_marks: string | null
  pass_total_percent: string | null
  fail_if_any_component_fail: boolean
  components: ExamComponent[]
  created_at?: string
  updated_at?: string
}

export interface ExamInput {
  academic_period: number
  department?: number | null
  title: string
  exam_type?: string
  scheduled_at?: string | null
  passing_mode: PassingMode
  pass_total_marks?: string | null
  pass_total_percent?: string | null
  fail_if_any_component_fail?: boolean
}

export interface ExamComponentInput {
  exam: number
  name: string
  sequence: number
  max_marks: string
  pass_marks?: string | null
  pass_percent?: string | null
  is_mandatory_to_pass?: boolean
  department?: number | null
}

export interface ExamListParams {
  page?: number
  search?: string
  academic_period?: number
  department?: number
  published?: boolean
  ordering?: string
}

export interface LookupOption {
  id: number
  name: string
}

export const examsService = {
  async getAll(params?: ExamListParams): Promise<Paginated<Exam>> {
    const response = await api.get<Paginated<Exam>>('/api/exams/', { params })
    return response.data
  },

  async getById(id: number): Promise<Exam> {
    const response = await api.get<Exam>(`/api/exams/${id}/`)
    return response.data
  },

  async create(data: ExamInput): Promise<Exam> {
    const response = await api.post<Exam>('/api/exams/', data)
    return response.data
  },

  async update(id: number, data: Partial<ExamInput>): Promise<Exam> {
    const response = await api.patch<Exam>(`/api/exams/${id}/`, data)
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/exams/${id}/`)
  },

  async publish(id: number): Promise<Exam> {
    const response = await api.post<Exam>(`/api/exams/${id}/publish/`)
    return response.data
  },

  async getComponents(examId: number): Promise<Paginated<ExamComponent>> {
    const response = await api.get<Paginated<ExamComponent>>('/api/exam-components/', {
      params: { exam: examId },
    })
    return response.data
  },

  async createComponent(data: ExamComponentInput): Promise<ExamComponent> {
    const response = await api.post<ExamComponent>('/api/exam-components/', data)
    return response.data
  },

  async updateComponent(id: number, data: Partial<ExamComponentInput>): Promise<ExamComponent> {
    const response = await api.patch<ExamComponent>(`/api/exam-components/${id}/`, data)
    return response.data
  },

  async removeComponent(id: number): Promise<void> {
    await api.delete(`/api/exam-components/${id}/`)
  },

  /** Academic periods for the exam form selector. */
  async getAcademicPeriods(): Promise<LookupOption[]> {
    const response = await api.get<Paginated<LookupOption> | LookupOption[]>('/api/academics/academic-periods/')
    return resultsOf(response.data).map(({ id, name }) => ({ id, name }))
  },

  /** Departments for the exam form selector. */
  async getDepartments(): Promise<LookupOption[]> {
    const response = await api.get<Paginated<LookupOption> | LookupOption[]>('/api/academics/departments/')
    return resultsOf(response.data).map(({ id, name }) => ({ id, name }))
  },
}
