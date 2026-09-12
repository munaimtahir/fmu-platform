import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { VoucherGenerationForm } from '@/features/finance/VoucherGenerationForm'
import { financeService } from '@/services'

export const VoucherGenerationPage: React.FC = () => {
  const [result, setResult] = useState<{ created: number[]; skipped: number[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (payload: { program_id?: number; term_id: number; due_date: string }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await financeService.generateVouchers(payload)
      setResult(response)
    } catch (err) {
      setError('Failed to generate vouchers. Please try again.')
      console.error('Error generating vouchers:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-ink-primary">Voucher Generation</h1>
          <p className="text-ink-secondary">Create vouchers for a program or selected students.</p>
        </div>

        <Card>
          <VoucherGenerationForm onSubmit={handleGenerate} isLoading={loading} />
          {error && (
            <Alert variant="error" className="mt-4">
              {error}
            </Alert>
          )}
          {result && (
            <div className="mt-4 text-sm text-ink-secondary">
              <p>Created: {result.created.length}</p>
              <p>Skipped: {result.skipped.length}</p>
            </div>
          )}
        </Card>
      </div>
    
  )
}
