import React from 'react'

export interface BadgeProps {
  /** The content to be rendered inside the badge. */
  children: React.ReactNode
  /** The color scheme of the badge. */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /** Additional CSS classes to apply to the badge. */
  className?: string
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
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <span
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
