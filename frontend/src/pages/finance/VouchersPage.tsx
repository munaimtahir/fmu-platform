import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { Voucher } from '@/types'
import { Button } from '@/components/ui/Button'

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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-gray-600">View and manage vouchers.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

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

        {/* Cancel Voucher Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full m-4">
              <h2 className="text-lg font-semibold mb-4">Cancel Voucher</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
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
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
