import React, { useEffect, useState } from 'react'
import api from '@/api/axios'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'

interface FinanceStats {
  total_vouchers?: number
  payments_recorded?: number
  finance_outstanding?: number
  paid_vouchers?: number
  overdue_vouchers?: number
}

export const FinanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinanceStats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get<FinanceStats>('/api/dashboard/stats/')
        setStats(response.data)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Collections, vouchers, and outstanding balances.</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-sm text-gray-500">Total Vouchers</h3>
              <p className="text-2xl font-semibold">{stats.total_vouchers ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-gray-500">Verified Payments</h3>
              <p className="text-2xl font-semibold">{stats.payments_recorded ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-gray-500">Outstanding (derived)</h3>
              <p className="text-2xl font-semibold">
                {typeof stats.finance_outstanding === 'number' ? stats.finance_outstanding.toFixed(2) : '0.00'}
              </p>
            </Card>
            <Card>
              <h3 className="text-sm text-gray-500">Paid Vouchers</h3>
              <p className="text-2xl font-semibold">{stats.paid_vouchers ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-gray-500">Overdue Vouchers</h3>
              <p className="text-2xl font-semibold">{stats.overdue_vouchers ?? 0}</p>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
