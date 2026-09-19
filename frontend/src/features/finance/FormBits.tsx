import React from 'react'
import { Alert } from '@/components/ui/Alert'
import type { ApiErrorInfo } from '@/lib/apiErrors'

/** Shown above a form when the server rejects it and no field explains why. */
export const FormError: React.FC<{ error: ApiErrorInfo | null; hasFieldErrors?: boolean }> = ({ error, hasFieldErrors }) => {
  if (!error) return null
  // Field-level messages already appear next to their inputs; avoid repeating the summary.
  if (hasFieldErrors && Object.keys(error.fieldErrors).length > 0) return null
  return <Alert variant="error">{error.message}</Alert>
}

export const CheckboxField: React.FC<{
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}> = ({ id, label, checked, onChange, disabled }) => (
  <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink-secondary">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-surface-border"
    />
    {label}
  </label>
)
