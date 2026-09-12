import React from 'react'

export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Groups related form fields under a heading + optional description, so
 * longer forms (student/course/section create-edit, etc.) can be broken
 * into scannable sections instead of one flat field list.
 */
export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, className = '' }) => (
  <fieldset className={`space-y-4 ${className}`}>
    <div>
      <legend className="text-h4 text-ink-primary">{title}</legend>
      {description && <p className="mt-1 text-body-sm text-ink-secondary">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </fieldset>
)
