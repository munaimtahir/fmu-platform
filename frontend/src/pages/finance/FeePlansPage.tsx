import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import type { FeePlan } from '@/types'
import { financeService } from '@/services'

export const FeePlansPage: React.FC = () => {
  const [feePlans, setFeePlans] = useState<FeePlan[]>([])
  const [form, setForm] = useState<Partial<FeePlan>>({
    is_mandatory: true,
    frequency: 'per_term',
  })
  const [message, setMessage] = useState<string>('')

  const loadFeePlans = async () => {
    const data = await financeService.getFeePlans()
    setFeePlans(data)
  }

  useEffect(() => {
    loadFeePlans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!form.program || !form.term || !form.fee_type || !form.amount) {
      setMessage('Program, term, fee type, and amount are required.')
      return
    }
    await financeService.createFeePlan(form)
    setMessage('Fee plan created.')
    setForm({ is_mandatory: true, frequency: 'per_term' })
    loadFeePlans()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Plans</h1>
          <p className="text-gray-600">Manage per-term fee schedules.</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Create Fee Plan</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program ID</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={form.program ?? ''}
                onChange={(e) => setForm({ ...form, program: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Term ID</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={form.term ?? ''}
                onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Type ID</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={form.fee_type ?? ''}
                onChange={(e) => setForm({ ...form, fee_type: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={form.amount ?? ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="mt-2 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Save
              </button>
              {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-2">Existing Fee Plans</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
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
    </DashboardLayout>
  )
}
