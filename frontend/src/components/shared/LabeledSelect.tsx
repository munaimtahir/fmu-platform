import React from 'react'
import { Label } from '@/components/ui/Label'

export interface LabeledSelectOption {
  value: string | number
  label: string
}

export interface LabeledSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  id: string
  label: string
  value: string | number | ''
  options: LabeledSelectOption[]
  onChange: (value: string) => void
  /** Text for the empty choice; omit to force a selection. */
  placeholder?: string
  error?: string
}

/** A labelled native `<select>` styled like `Input`, with inline server-side error text. */
export const LabeledSelect: React.FC<LabeledSelectProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  required,
  className = '',
  ...rest
}) => (
  <div className="w-full">
    <Label htmlFor={id} required={required}>
      {label}
    </Label>
    <select
      id={id}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`w-full px-4 py-2 rounded-2xl border bg-white text-ink-primary transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-surface disabled:cursor-not-allowed
        ${error ? 'border-danger focus:ring-danger' : 'border-surface-border focus:ring-primary-600'} ${className}`}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-body-sm text-danger" role="alert">
        {error}
      </p>
    )}
  </div>
)
