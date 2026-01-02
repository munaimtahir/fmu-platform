import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/useAuth'
import type { FinanceSummary, Voucher } from '@/types'
import { financeService } from '@/services'

export const StudentFinancePage: React.FC = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.student_id) {
        setLoading(false)
        return
      }
      const data = await financeService.getStudentSummary(user.student_id)
      const voucherList = await financeService.listVouchers({ student: user.student_id })
      setSummary(data)
      setVouchers(voucherList)
      setLoading(false)
    }
    load()
  }, [user])

  if (!user?.student_id) {
    return (
      <DashboardLayout>
        <p className="text-gray-600">No student profile linked to this account.</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>
          <p className="text-gray-600">Voucher balances and finance gates.</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            {summary && (
              <Card>
                <h2 className="text-lg font-semibold mb-2">Balance Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Outstanding</p>
                    <p className="text-xl font-semibold">{summary.outstanding}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Debits</p>
                    <p className="text-xl font-semibold">{summary.total_debits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Credits</p>
                    <p className="text-xl font-semibold">{summary.total_credits}</p>
                  </div>
                </div>
                {summary.gating && (
                  <div className="mt-3 text-sm text-gray-700">
                    {!summary.gating['can_view_transcript'] && (
                      <p className="text-red-600">Transcript locked until dues are cleared.</p>
                    )}
                    {!summary.gating['can_view_results'] && (
                      <p className="text-red-600">Results locked until dues are cleared.</p>
                    )}
                  </div>
                )}
              </Card>
            )}

            <Card>
              <h2 className="text-lg font-semibold mb-2">Vouchers</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{voucher.voucher_no}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{voucher.term_name || voucher.term}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{voucher.status}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{voucher.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
