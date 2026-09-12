import React from 'react'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

export interface BadgeProps {
  /** The content to be rendered inside the badge. */
  children: React.ReactNode
  /** The color scheme of the badge. */
  variant?: BadgeVariant
  /** Additional CSS classes to apply to the badge. */
  className?: string
  'data-testid'?: string
}

/**
 * A component to display a badge with different color variants.
 *
 * Badges are used to highlight small pieces of information, such as statuses
 * or categories. This component provides several pre-defined color schemes.
 *
 * @component
 * @param {BadgeProps} props The props for the component.
 * @returns {React.ReactElement} The rendered `Badge` component.
 *
 * @example
 * <Badge variant="success">Active</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  'data-testid': dataTestId,
}) => {
  const variants = {
    default: 'bg-neutral-subtle text-neutral-emphasis',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-subtle text-success-emphasis',
    warning: 'bg-warning-subtle text-warning-emphasis',
    danger: 'bg-danger-subtle text-danger-emphasis',
    info: 'bg-info-subtle text-info-emphasis',
    secondary: 'bg-neutral-subtle text-neutral-emphasis',
  }

  return (
    <span
      data-testid={dataTestId}
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
