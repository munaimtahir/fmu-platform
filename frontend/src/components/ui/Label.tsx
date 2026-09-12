import React from 'react'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

/**
 * Standalone form label with a required-field asterisk, extracted from
 * `Input` so non-Input fields (select, textarea, checkbox groups) can share
 * the same label styling and required-indicator convention.
 */
export const Label: React.FC<LabelProps> = ({ required, children, className = '', ...props }) => (
  <label className={`block text-sm font-medium text-ink-primary mb-1.5 ${className}`} {...props}>
    {children}
    {required && (
      <span className="text-danger ml-0.5" aria-hidden="true">
        *
      </span>
    )}
  </label>
)
