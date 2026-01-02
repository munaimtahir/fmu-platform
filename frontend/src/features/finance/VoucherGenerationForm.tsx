import React, { useState } from 'react'

interface VoucherGenerationFormProps {
  onSubmit: (payload: { program_id?: number; term_id: number; due_date: string }) => Promise<void> | void
  isLoading?: boolean
}

export const VoucherGenerationForm: React.FC<VoucherGenerationFormProps> = ({ onSubmit, isLoading }) => {
  const [programId, setProgramId] = useState<string>('')
  const [termId, setTermId] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!termId || !dueDate) {
      setError('Term and due date are required.')
      return
    }

    await onSubmit({
      program_id: programId ? Number(programId) : undefined,
      term_id: Number(termId),
      due_date: dueDate,
    })
    setSuccess('Vouchers generation requested.')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700">Program ID (optional)</label>
        <input
          type="number"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Program ID"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Term ID</label>
        <input
          type="number"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Term ID"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isLoading ? 'Generating...' : 'Generate Vouchers'}
      </button>
    </form>
  )
}
