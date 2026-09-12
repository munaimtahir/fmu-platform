import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { Voucher } from '@/types'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { TextArea } from '@/components/ui/TextArea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Heading, Text } from '@/components/ui/Typography'

export const VouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    setLoading(true)
    try {
      const data = await financeService.listVouchers()
      setVouchers(data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load vouchers')
      console.error('Error loading vouchers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (voucherId: number) => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    setCancellingId(voucherId)
    try {
      await financeService.cancelVoucher(voucherId, cancelReason)
      setShowCancelModal(null)
      setCancelReason('')
      await loadVouchers()
      alert('Voucher cancelled successfully')
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel voucher')
      console.error('Error cancelling voucher:', err)
    } finally {
      setCancellingId(null)
    }
  }

  const columns: ColumnDef<Voucher>[] = [
    {
      accessorKey: 'voucher_no',
      header: 'Voucher No',
    },
    {
      accessorKey: 'student_name',
      header: 'Student',
    },
    {
      accessorKey: 'term_name',
      header: 'Term',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge domain="finance" status={row.getValue('status')} />,
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => `${parseFloat(row.getValue('total_amount')).toFixed(2)} PKR`,
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => new Date(row.getValue('due_date')).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const voucher = row.original
        if (voucher.status === 'cancelled' || voucher.status === 'paid') return null
        return (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowCancelModal(voucher.id)}
          >
            Cancel
          </Button>
        )
      },
    },
  ]

  return (
    
      <div className="space-y-6">
        <div>
          <Heading level={1}>Vouchers</Heading>
          <Text tone="secondary">View and manage vouchers.</Text>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <Card>
          <DataTable
            data={vouchers}
            columns={columns}
            enableSorting
            enableFiltering
            enablePagination
            isLoading={loading}
          />
        </Card>

        {showCancelModal && (
          <Modal
            title="Cancel Voucher"
            onClose={() => {
              setShowCancelModal(null)
              setCancelReason('')
            }}
          >
            <div className="space-y-4">
              <TextArea
                id="cancel-voucher-reason"
                label="Reason"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCancelModal(null)
                    setCancelReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleCancel(showCancelModal)}
                  disabled={cancellingId === showCancelModal || !cancelReason.trim()}
                >
                  {cancellingId === showCancelModal ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>

  )
}
