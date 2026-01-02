import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { VoucherGenerationForm } from '@/features/finance/VoucherGenerationForm'
import { financeService } from '@/services'

export const VoucherGenerationPage: React.FC = () => {
  const [result, setResult] = useState<{ created: number[]; skipped: number[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (payload: { program_id?: number; term_id: number; due_date: string }) => {
    setLoading(true)
    const response = await financeService.generateVouchers(payload)
    setResult(response)
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher Generation</h1>
          <p className="text-gray-600">Create vouchers for a program or selected students.</p>
        </div>

        <Card>
          <VoucherGenerationForm onSubmit={handleGenerate} isLoading={loading} />
          {result && (
            <div className="mt-4 text-sm text-gray-700">
              <p>Created: {result.created.length}</p>
              <p>Skipped: {result.skipped.length}</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
