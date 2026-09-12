import React, { useEffect, useState } from 'react'
import api from '@/api/axios'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get<FinanceStats>('/api/dashboard/stats/')
        setStats(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load finance statistics. Please try again later.')
        console.error('Error loading finance stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-ink-primary">Finance Dashboard</h1>
          <p className="text-ink-secondary">Collections, vouchers, and outstanding balances.</p>
        </div>

        {loading ? (
          <p className="text-ink-muted">Loading...</p>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-sm text-ink-muted">Total Vouchers</h3>
              <p className="text-h2">{stats.total_vouchers ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-ink-muted">Verified Payments</h3>
              <p className="text-h2">{stats.payments_recorded ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-ink-muted">Outstanding (derived)</h3>
              <p className="text-h2">
                {typeof stats.finance_outstanding === 'number' ? stats.finance_outstanding.toFixed(2) : '0.00'}
              </p>
            </Card>
            <Card>
              <h3 className="text-sm text-ink-muted">Paid Vouchers</h3>
              <p className="text-h2">{stats.paid_vouchers ?? 0}</p>
            </Card>
            <Card>
              <h3 className="text-sm text-ink-muted">Overdue Vouchers</h3>
              <p className="text-h2">{stats.overdue_vouchers ?? 0}</p>
            </Card>
          </div>
        )}
      </div>
    
  )
}
