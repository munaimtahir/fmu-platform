import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/useAuth'
import type { FinanceSummary, Voucher } from '@/types'
import { financeService } from '@/services'

export const StudentFinancePage: React.FC = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.student_id) {
        setLoading(false)
        return
      }
      try {
        const data = await financeService.getStudentSummary(user.student_id)
        const voucherList = await financeService.listVouchers({ student: user.student_id })
        setSummary(data)
        setVouchers(voucherList)
        setError(null)
      } catch (err) {
        setError('Failed to load finance information. Please try again later.')
        console.error('Error loading student finance data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user?.student_id) {
    return (
      
        <p className="text-ink-secondary">No student profile linked to this account.</p>
      
    )
  }

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-ink-primary">My Fees</h1>
          <p className="text-ink-secondary">Voucher balances and finance gates.</p>
        </div>

        {loading ? (
          <p className="text-ink-muted">Loading...</p>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : (
          <>
            {summary && (
              <Card>
                <h2 className="text-h4 mb-2">Balance Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-ink-muted">Outstanding</p>
                    <p className="text-h3">{summary.outstanding}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted">Total Debits</p>
                    <p className="text-h3">{summary.total_debits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted">Total Credits</p>
                    <p className="text-h3">{summary.total_credits}</p>
                  </div>
                </div>
                {summary.gating && (
                  <div className="mt-3 text-sm text-ink-secondary">
                    {!summary.gating['can_view_transcript'] && (
                      <p className="text-danger">Transcript locked until dues are cleared.</p>
                    )}
                    {!summary.gating['can_view_results'] && (
                      <p className="text-danger">Results locked until dues are cleared.</p>
                    )}
                  </div>
                )}
              </Card>
            )}

            <Card>
              <h2 className="text-h4 mb-2">Vouchers</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-surface-border">
                  <thead>
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Voucher</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Term</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td className="px-3 py-2 text-sm text-ink-primary">{voucher.voucher_no}</td>
                        <td className="px-3 py-2 text-sm text-ink-primary">{voucher.term_name || voucher.term}</td>
                        <td className="px-3 py-2 text-sm text-ink-primary">
                          <StatusBadge domain="finance" status={voucher.status} />
                        </td>
                        <td className="px-3 py-2 text-sm text-ink-primary">{voucher.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    
  )
}
