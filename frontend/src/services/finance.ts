import api from '@/api/axios'
import { downloadFile } from '@/lib/download'
import type { Paginated } from '@/lib/pagination'
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

/** DRF serialises decimals as strings; accept both when sending and reading. */
export type Decimal = string | number

/** Backend page size for every finance list (DRF PageNumberPagination default). */
export const FINANCE_PAGE_SIZE = 50

export interface ListParams {
  page?: number
  search?: string
  ordering?: string
  [filter: string]: string | number | boolean | undefined
}

export interface FeeTypeInput {
  code: string
  name: string
  is_active: boolean
}

export interface FeePlanInput {
  program: number
  term: number
  fee_type: number
  amount: Decimal
  is_mandatory: boolean
  frequency: 'one_time' | 'per_term'
  effective_from?: string | null
  is_active: boolean
}

export interface FeePlanFilters extends ListParams {
  program?: number
  term?: number
  fee_type?: number
  is_active?: boolean
}

export interface VoucherFilters extends ListParams {
  student?: number
  term?: number
  status?: string
}

export interface PaymentRecord extends Payment {
  student_reg_no?: string
  notes?: string
  received_by?: number | null
}

export interface PaymentFilters extends ListParams {
  student?: number
  term?: number
  status?: string
  method?: string
}

export interface RecordPaymentInput {
  student: number
  term: number
  amount: Decimal
  method: string
  voucher?: number
  reference_no?: string
}

export interface LedgerEntry {
  id: number
  student: number
  student_reg_no?: string
  student_name?: string
  term: number
  term_name?: string
  entry_type: 'debit' | 'credit'
  amount: Decimal
  currency?: string
  reference_type: string
  reference_id: string
  description: string
  voucher: number | null
  created_by: number | null
  created_at: string
  voided_at: string | null
  void_reason: string
}

export interface LedgerFilters extends ListParams {
  student?: number
  term?: number
  entry_type?: string
  reference_type?: string
}

export type AdjustmentKind = 'waiver' | 'scholarship' | 'adjustment' | 'fine_reversal'
export type AdjustmentStatus = 'pending' | 'approved' | 'rejected'

export interface Adjustment {
  id: number
  student: number
  student_reg_no?: string
  student_name?: string
  term: number
  term_name?: string
  kind: AdjustmentKind
  amount: Decimal
  reason: string
  requested_by: number | null
  approved_by: number | null
  approved_at: string | null
  status: AdjustmentStatus
  created_at: string
  updated_at: string
}

export interface AdjustmentInput {
  student: number
  term: number
  kind: AdjustmentKind
  amount: Decimal
  reason: string
}

export interface AdjustmentFilters extends ListParams {
  student?: number
  term?: number
  kind?: string
  status?: string
}

export interface FinancePolicy {
  id: number
  rule_key: string
  description: string
  threshold_amount: Decimal
  fee_type: number | null
  fee_type_code?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FinancePolicyInput {
  rule_key: string
  description: string
  threshold_amount: Decimal
  fee_type: number | null
  is_active: boolean
}

export interface VoucherItemRow {
  id: number
  fee_type: number
  fee_type_code?: string
  description?: string
  amount: Decimal
}

/** Voucher with the balance summary the detail endpoint returns. */
export interface VoucherDetail extends Omit<Voucher, 'balance' | 'items'> {
  items: VoucherItemRow[]
  balance?: {
    student_id?: number
    term_id?: number | null
    outstanding: Decimal
    total_debits?: Decimal
    total_credits?: Decimal
  }
}

/** Payment reversals are recorded by the backend as a "[REVERSED]" note marker; status stays "verified". */
export function isPaymentReversed(payment: Pick<PaymentRecord, 'notes'>): boolean {
  return (payment.notes ?? '').includes('[REVERSED]')
}

export const financeService = {
  // ---- fee types
  async getFeeTypes(): Promise<FeeType[]> {
    const response = await api.get<FeeType[]>('/api/finance/fee-types/')
    return (response.data as any).results ?? response.data
  },
  async listFeeTypes(params?: ListParams): Promise<Paginated<FeeType>> {
    const response = await api.get<Paginated<FeeType>>('/api/finance/fee-types/', { params })
    return response.data
  },
  async createFeeType(payload: FeeTypeInput): Promise<FeeType> {
    const response = await api.post<FeeType>('/api/finance/fee-types/', payload)
    return response.data
  },
  async updateFeeType(id: number, payload: Partial<FeeTypeInput>): Promise<FeeType> {
    const response = await api.patch<FeeType>(`/api/finance/fee-types/${id}/`, payload)
    return response.data
  },
  async deleteFeeType(id: number): Promise<void> {
    await api.delete(`/api/finance/fee-types/${id}/`)
  },

  // ---- fee plans
  async getFeePlans(): Promise<FeePlan[]> {
    const response = await api.get<FeePlan[]>('/api/finance/fee-plans/')
    return (response.data as any).results ?? response.data
  },
  async listFeePlans(params?: FeePlanFilters): Promise<Paginated<FeePlan>> {
    const response = await api.get<Paginated<FeePlan>>('/api/finance/fee-plans/', { params })
    return response.data
  },
  async createFeePlan(payload: Partial<FeePlan> | FeePlanInput): Promise<FeePlan> {
    const response = await api.post<FeePlan>('/api/finance/fee-plans/', payload)
    return response.data
  },
  async updateFeePlan(id: number, payload: Partial<FeePlanInput>): Promise<FeePlan> {
    const response = await api.patch<FeePlan>(`/api/finance/fee-plans/${id}/`, payload)
    return response.data
  },
  async deleteFeePlan(id: number): Promise<void> {
    await api.delete(`/api/finance/fee-plans/${id}/`)
  },

  // ---- vouchers
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
    return (response.data as any).results ?? response.data
  },
  async listVouchersPage(params?: VoucherFilters): Promise<Paginated<Voucher>> {
    const response = await api.get<Paginated<Voucher>>('/api/finance/vouchers/', { params })
    return response.data
  },
  async getVoucher(id: number): Promise<VoucherDetail> {
    const response = await api.get<VoucherDetail>(`/api/finance/vouchers/${id}/`)
    return response.data
  },
  async reconcileVoucher(id: number): Promise<VoucherDetail> {
    const response = await api.post<VoucherDetail>(`/api/finance/vouchers/${id}/reconcile/`)
    return response.data
  },
  async cancelVoucher(voucherId: number, reason: string): Promise<Voucher> {
    const response = await api.post<Voucher>(`/api/finance/vouchers/${voucherId}/cancel/`, {
      reason,
    })
    return response.data
  },
  downloadVoucherPdf(id: number, voucherNo?: string): Promise<string> {
    return downloadFile(`/api/finance/vouchers/${id}/pdf/`, {
      filename: `voucher_${voucherNo ?? id}.pdf`,
    })
  },

  // ---- payments
  async listPayments(params?: Record<string, unknown>): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/api/finance/payments/', { params })
    return (response.data as any).results ?? response.data
  },
  async listPaymentsPage(params?: PaymentFilters): Promise<Paginated<PaymentRecord>> {
    const response = await api.get<Paginated<PaymentRecord>>('/api/finance/payments/', { params })
    return response.data
  },
  async recordPayment(payload: RecordPaymentInput): Promise<Payment> {
    const response = await api.post<Payment>('/api/finance/payments/', payload)
    return response.data
  },
  async verifyPayment(id: number): Promise<Payment> {
    const response = await api.post<Payment>(`/api/finance/payments/${id}/verify/`, {
      approve: true,
    })
    return response.data
  },
  async rejectPayment(id: number, notes: string): Promise<Payment> {
    const response = await api.post<Payment>(`/api/finance/payments/${id}/verify/`, {
      approve: false,
      notes,
    })
    return response.data
  },
  async reversePayment(paymentId: number, reason: string): Promise<Payment> {
    const response = await api.post<Payment>(`/api/finance/payments/${paymentId}/reverse/`, {
      reason,
    })
    return response.data
  },
  downloadPaymentReceipt(id: number, receiptNo?: string): Promise<string> {
    return downloadFile(`/api/finance/payments/${id}/pdf/`, {
      filename: `receipt_${receiptNo ?? id}.pdf`,
    })
  },

  // ---- ledger (read-only)
  async listLedgerEntries(params?: LedgerFilters): Promise<Paginated<LedgerEntry>> {
    const response = await api.get<Paginated<LedgerEntry>>('/api/finance/ledger/', { params })
    return response.data
  },

  // ---- adjustments
  async listAdjustments(params?: AdjustmentFilters): Promise<Paginated<Adjustment>> {
    const response = await api.get<Paginated<Adjustment>>('/api/finance/adjustments/', { params })
    return response.data
  },
  async createAdjustment(payload: AdjustmentInput): Promise<Adjustment> {
    const response = await api.post<Adjustment>('/api/finance/adjustments/', payload)
    return response.data
  },
  async updateAdjustment(id: number, payload: Partial<AdjustmentInput>): Promise<Adjustment> {
    const response = await api.patch<Adjustment>(`/api/finance/adjustments/${id}/`, payload)
    return response.data
  },
  async deleteAdjustment(id: number): Promise<void> {
    await api.delete(`/api/finance/adjustments/${id}/`)
  },
  async approveAdjustment(id: number, approve: boolean, reason?: string): Promise<Adjustment> {
    const response = await api.post<Adjustment>(`/api/finance/adjustments/${id}/approve/`, {
      approve,
      ...(reason ? { reason } : {}),
    })
    return response.data
  },

  // ---- policies
  async listPolicies(params?: ListParams): Promise<Paginated<FinancePolicy>> {
    const response = await api.get<Paginated<FinancePolicy>>('/api/finance/policies/', { params })
    return response.data
  },
  async createPolicy(payload: FinancePolicyInput): Promise<FinancePolicy> {
    const response = await api.post<FinancePolicy>('/api/finance/policies/', payload)
    return response.data
  },
  async updatePolicy(id: number, payload: Partial<FinancePolicyInput>): Promise<FinancePolicy> {
    const response = await api.patch<FinancePolicy>(`/api/finance/policies/${id}/`, payload)
    return response.data
  },
  async deletePolicy(id: number): Promise<void> {
    await api.delete(`/api/finance/policies/${id}/`)
  },

  // ---- student finance and reports
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
  async getPrograms(): Promise<{ id: number; name: string }[]> {
    const response = await api.get('/api/academics/programs/')
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
  downloadDefaultersCSV(
    payload: { program_id?: number; term_id: number; min_outstanding?: number },
    filename: string
  ): Promise<string> {
    return downloadFile('/api/finance/reports/defaulters/', {
      method: 'post',
      data: payload,
      params: { format: 'csv' },
      filename,
    })
  },
  async getCollectionReport(startDate: string, endDate: string): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/api/finance/reports/collection/', {
      params: { start: startDate, end: endDate },
    })
    return response.data
  },
  downloadCollectionCSV(startDate: string, endDate: string, filename: string): Promise<string> {
    return downloadFile('/api/finance/reports/collection/', {
      params: { start: startDate, end: endDate, format: 'csv' },
      filename,
    })
  },
  async getAgingReport(termId?: number): Promise<AgingReport> {
    const response = await api.get<AgingReport>('/api/finance/reports/aging/', {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },
  downloadAgingCSV(termId: number | undefined, filename: string): Promise<string> {
    return downloadFile('/api/finance/reports/aging/', {
      params: termId ? { term: termId, format: 'csv' } : { format: 'csv' },
      filename,
    })
  },
  async getStudentStatement(studentId: number, termId?: number): Promise<StudentStatement> {
    const response = await api.get<StudentStatement>(`/api/finance/students/${studentId}/statement/`, {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },
  downloadStatementPdf(studentId: number, termId: number | undefined, filename: string): Promise<string> {
    return downloadFile(`/api/finance/students/${studentId}/statement/pdf/`, {
      params: termId ? { term: termId } : undefined,
      filename,
    })
  },
}
