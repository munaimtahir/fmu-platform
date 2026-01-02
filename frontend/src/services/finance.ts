import api from '@/api/axios'
import type {
  AgingReport,
  CollectionReport,
  DefaulterRow,
  FeePlan,
  FeeType,
  FinanceSummary,
  Payment,
  StudentStatement,
  Voucher,
} from '@/types'

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
  async listPayments(params?: Record<string, unknown>): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/api/finance/payments/', { params })
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
  async getDefaultersReport(payload: {
    program_id?: number
    term_id: number
    min_outstanding?: number
  }): Promise<DefaulterRow[]> {
    const response = await api.post<{ rows: DefaulterRow[] }>('/api/finance/reports/defaulters/', payload)
    return response.data.rows
  },
  async exportDefaultersCSV(payload: {
    program_id?: number
    term_id: number
    min_outstanding?: number
  }): Promise<Blob> {
    const response = await api.post(
      '/api/finance/reports/defaulters/?format=csv',
      payload,
      { responseType: 'blob' }
    )
    return response.data
  },
  async getCollectionReport(startDate: string, endDate: string): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/api/finance/reports/collection/', {
      params: { start: startDate, end: endDate },
    })
    return response.data
  },
  async exportCollectionCSV(startDate: string, endDate: string): Promise<Blob> {
    const response = await api.get('/api/finance/reports/collection/', {
      params: { start: startDate, end: endDate, format: 'csv' },
      responseType: 'blob',
    })
    return response.data
  },
  async getAgingReport(termId?: number): Promise<AgingReport> {
    const response = await api.get<AgingReport>('/api/finance/reports/aging/', {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },
  async exportAgingCSV(termId?: number): Promise<Blob> {
    const response = await api.get('/api/finance/reports/aging/', {
      params: termId ? { term: termId, format: 'csv' } : { format: 'csv' },
      responseType: 'blob',
    })
    return response.data
  },
  async getStudentStatement(studentId: number, termId?: number): Promise<StudentStatement> {
    const response = await api.get<StudentStatement>(`/api/finance/students/${studentId}/statement/`, {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },
  async downloadStatementPDF(studentId: number, termId?: number): Promise<Blob> {
    const response = await api.get(`/api/finance/students/${studentId}/statement/pdf/`, {
      params: termId ? { term: termId } : undefined,
      responseType: 'blob',
    })
    return response.data
  },
  async reversePayment(paymentId: number, reason: string): Promise<Payment> {
    const response = await api.post<Payment>(`/api/finance/payments/${paymentId}/reverse/`, {
      reason,
    })
    return response.data
  },
  async cancelVoucher(voucherId: number, reason: string): Promise<Voucher> {
    const response = await api.post<Voucher>(`/api/finance/vouchers/${voucherId}/cancel/`, {
      reason,
    })
    return response.data
  },
  async getPrograms(): Promise<{ id: number; name: string }[]> {
    const response = await api.get('/api/academics/programs/')
    return response.data.results ?? response.data
  },
}
