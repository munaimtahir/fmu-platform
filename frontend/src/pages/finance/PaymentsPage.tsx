import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { Payment } from '@/types'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { TextArea } from '@/components/ui/TextArea'
import { StatusBadge } from '@/components/ui/StatusBadge'

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
      cell: ({ row }) => <StatusBadge domain="finance" status={row.getValue('status')} />,
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
    
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-ink-primary">Payments</h1>
          <p className="text-ink-secondary">View and manage payment records.</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

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

        {showReverseModal && (
          <Modal
            title="Reverse Payment"
            onClose={() => {
              setShowReverseModal(null)
              setReverseReason('')
            }}
          >
            <div className="space-y-4">
              <TextArea
                id="reverse-payment-reason"
                label="Reason"
                required
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                rows={3}
              />
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
          </Modal>
        )}
      </div>

  )
}
