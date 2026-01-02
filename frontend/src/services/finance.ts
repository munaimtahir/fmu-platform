import api from '@/api/axios'
import type { FeePlan, FeeType, FinanceSummary, Payment, Voucher } from '@/types'

export const financeService = {
  async getFeeTypes(): Promise<FeeType[]> {
    const response = await api.get<FeeType[]>('/api/finance/fee-types/')
    // @ts-expect-error handle paginated or list responses
    return (response.data as any).results ?? response.data
  },
  async getFeePlans(): Promise<FeePlan[]> {
    const response = await api.get<FeePlan[]>('/api/finance/fee-plans/')
    // @ts-expect-error handle paginated or list responses
    return (response.data as any).results ?? response.data
  },
  async createFeePlan(payload: Partial<FeePlan>): Promise<FeePlan> {
    const response = await api.post<FeePlan>('/api/finance/fee-plans/', payload)
    return response.data
  },
  async generateVouchers(payload: {
    program_id?: number
    term_id: number
    student_ids?: number[]
    due_date: string
    fee_type_ids?: number[]
  }): Promise<{ created: number[]; skipped: number[] }> {
    const response = await api.post('/api/finance/vouchers/generate/', payload)
    return response.data
  },
  async listVouchers(params?: Record<string, unknown>): Promise<Voucher[]> {
    const response = await api.get<Voucher[]>('/api/finance/vouchers/', { params })
    // @ts-expect-error handle paginated or list responses
    return (response.data as any).results ?? response.data
  },
  async recordPayment(payload: {
    student: number
    term: number
    amount: number
    method: string
    voucher?: number
    reference_no?: string
  }): Promise<Payment> {
    const response = await api.post<Payment>('/api/finance/payments/', payload)
    return response.data
  },
  async verifyPayment(id: number): Promise<Payment> {
    const response = await api.post<Payment>(`/api/finance/payments/${id}/verify/`, {
      approve: true,
    })
    return response.data
  },
  async getStudentSummary(studentId: number, termId?: number): Promise<FinanceSummary> {
    const response = await api.get<FinanceSummary>(`/api/finance/students/${studentId}/`, {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },
  async getAcademicPeriods(): Promise<{ id: number; name: string }[]> {
    const response = await api.get('/api/academics/academic-periods/')
    return response.data.results ?? response.data
  },
}
