import React from 'react'
import { Label } from './Label'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={props.required}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2 rounded-2xl border
            ${error ? 'border-danger focus:ring-danger' : 'border-surface-border focus:ring-primary-600'}
            bg-white text-ink-primary placeholder-ink-muted
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-surface disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-body-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-body-sm text-ink-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
