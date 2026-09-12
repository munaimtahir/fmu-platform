import React, { forwardRef } from 'react'
import { format } from 'date-fns'

interface DatePickerProps {
  id?: string
  label?: string
  error?: string
  helperText?: string
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  min?: string
  max?: string
  className?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      value,
      onChange,
      placeholder = 'Select date...',
      disabled = false,
      required = false,
      min,
      max,
      className = '',
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value
      if (dateValue) {
        onChange(new Date(dateValue))
      } else {
        onChange(null)
      }
    }

    const formattedValue = value ? format(value, 'yyyy-MM-dd') : ''

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="date"
            value={formattedValue}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3 rounded-2xl border transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
              disabled:bg-surface disabled:text-ink-muted disabled:cursor-not-allowed
              ${error ? 'border-danger' : 'border-surface-border hover:border-ink-muted'}
            `}
          />
        </div>

        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {!error && helperText && <p className="mt-1 text-sm text-ink-muted">{helperText}</p>}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

interface DateRangePickerProps {
  label?: string
  error?: string
  helperText?: string
  startDate?: Date | null
  endDate?: Date | null
  onStartChange: (date: Date | null) => void
  onEndChange: (date: Date | null) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  error,
  helperText,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  disabled = false,
  required = false,
  className = '',
}) => {
  const minEndDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-ink-secondary mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={onStartChange}
          disabled={disabled}
          required={required}
          max={endDate ? format(endDate, 'yyyy-MM-dd') : undefined}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={onEndChange}
          disabled={disabled}
          required={required}
          min={minEndDate}
        />
      </div>

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {!error && helperText && <p className="mt-1 text-sm text-ink-muted">{helperText}</p>}
    </div>
  )
}

DateRangePicker.displayName = 'DateRangePicker'
