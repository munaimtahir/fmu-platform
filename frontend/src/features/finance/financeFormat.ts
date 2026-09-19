import type { Decimal } from '@/services/finance'

export function toNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** "1,250.00 PKR" */
export function formatMoney(value: Decimal | null | undefined, currency = 'PKR'): string {
  return `${toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

/** Non-empty, positive amount with at most two decimals. */
export function isValidAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && parseFloat(value) > 0
}
