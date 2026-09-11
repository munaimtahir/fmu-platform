import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FormSection } from '@/components/ui/FormSection'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import type { FeePlan } from '@/types'
import { financeService } from '@/services'

const emptyForm: Partial<FeePlan> = {
  is_mandatory: true,
  frequency: 'per_term',
}

export const FeePlansPage: React.FC = () => {
  const [feePlans, setFeePlans] = useState<FeePlan[]>([])
  const [form, setForm] = useState<Partial<FeePlan>>(emptyForm)
  const [message, setMessage] = useState<string>('')
  const [messageIsError, setMessageIsError] = useState(false)

  const loadFeePlans = async () => {
    const data = await financeService.getFeePlans()
    setFeePlans(data)
  }

  useEffect(() => {
    loadFeePlans()
  }, [])

  const isDirty = Boolean(form.program || form.term || form.fee_type || form.amount)
  useUnsavedChangesWarning(isDirty)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!form.program || !form.term || !form.fee_type || !form.amount) {
      setMessage('Program, term, fee type, and amount are required.')
      setMessageIsError(true)
      return
    }
    await financeService.createFeePlan(form)
    setMessage('Fee plan created.')
    setMessageIsError(false)
    setForm(emptyForm)
    loadFeePlans()
  }

  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Plans</h1>
          <p className="text-gray-600">Manage per-term fee schedules.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <FormSection title="Create Fee Plan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="feeplan-program"
                  label="Program ID"
                  type="number"
                  required
                  value={form.program ?? ''}
                  onChange={(e) => setForm({ ...form, program: Number(e.target.value) })}
                />
                <Input
                  id="feeplan-term"
                  label="Term ID"
                  type="number"
                  required
                  value={form.term ?? ''}
                  onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
                />
                <Input
                  id="feeplan-fee-type"
                  label="Fee Type ID"
                  type="number"
                  required
                  value={form.fee_type ?? ''}
                  onChange={(e) => setForm({ ...form, fee_type: Number(e.target.value) })}
                />
                <Input
                  id="feeplan-amount"
                  label="Amount"
                  type="number"
                  required
                  value={form.amount ?? ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Button type="submit">Save</Button>
                {message && (
                  <Alert variant={messageIsError ? 'error' : 'success'} className="mt-2">
                    {message}
                  </Alert>
                )}
              </div>
            </FormSection>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Existing Fee Plans</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feePlans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{plan.program_name || plan.program}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{plan.term_name || plan.term}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{plan.fee_type_code || plan.fee_type}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{plan.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    
  )
}
