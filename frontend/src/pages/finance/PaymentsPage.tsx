import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { Payment } from '@/types'
import { Button } from '@/components/ui/Button'

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reversingId, setReversingId] = useState<number | null>(null)
  const [showReverseModal, setShowReverseModal] = useState<number | null>(null)
  const [reverseReason, setReverseReason] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await financeService.listPayments?.() || []
      setPayments(data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load payments')
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReverse = async (paymentId: number) => {
    if (!reverseReason.trim()) {
      alert('Please provide a reason for reversal')
      return
    }

    setReversingId(paymentId)
    try {
      await financeService.reversePayment(paymentId, reverseReason)
      setShowReverseModal(null)
      setReverseReason('')
      await loadPayments()
      alert('Payment reversed successfully')
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reverse payment')
      console.error('Error reversing payment:', err)
    } finally {
      setReversingId(null)
    }
  }

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'receipt_no',
      header: 'Receipt No',
    },
    {
      accessorKey: 'student_name',
      header: 'Student',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `${parseFloat(row.getValue('amount')).toFixed(2)} PKR`,
    },
    {
      accessorKey: 'method',
      header: 'Method',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'received_at',
      header: 'Date',
      cell: ({ row }) => new Date(row.getValue('received_at')).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original
        if (payment.status !== 'verified') return null
        return (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowReverseModal(payment.id)}
          >
            Reverse
          </Button>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">View and manage payment records.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card>
          <DataTable
            data={payments}
            columns={columns}
            enableSorting
            enableFiltering
            enablePagination
            isLoading={loading}
          />
        </Card>

        {/* Reverse Payment Modal */}
        {showReverseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full m-4">
              <h2 className="text-lg font-semibold mb-4">Reverse Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reverseReason}
                    onChange={(e) => setReverseReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowReverseModal(null)
                      setReverseReason('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReverse(showReverseModal)}
                    disabled={reversingId === showReverseModal || !reverseReason.trim()}
                  >
                    {reversingId === showReverseModal ? 'Reversing...' : 'Confirm Reversal'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
