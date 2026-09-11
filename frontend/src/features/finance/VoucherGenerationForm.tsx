import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'

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

  const isDirty = Boolean(programId || termId || dueDate)
  useUnsavedChangesWarning(isDirty && !success)

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
      <Input
        id="voucher-gen-program"
        label="Program ID (optional)"
        type="number"
        value={programId}
        onChange={(e) => setProgramId(e.target.value)}
        placeholder="Program ID"
      />
      <Input
        id="voucher-gen-term"
        label="Term ID"
        required
        type="number"
        value={termId}
        onChange={(e) => setTermId(e.target.value)}
        placeholder="Term ID"
      />
      <Input
        id="voucher-gen-due-date"
        label="Due Date"
        required
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Vouchers'}
      </Button>
    </form>
  )
}
