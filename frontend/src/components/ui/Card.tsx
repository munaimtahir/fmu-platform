import React from 'react'

export interface CardProps {
  /** The content to be rendered inside the card. */
  children: React.ReactNode
  /** Additional CSS classes to apply to the card. */
  className?: string
  /** The padding size for the card. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Click handler for the card. */
  onClick?: () => void
}

/**
 * A flexible and reusable card component.
 *
 * This component provides a styled container for content, with customizable
 * padding and the ability to add extra CSS classes.
 *
 * @component
 * @param {CardProps} props The props for the component.
 * @returns {React.ReactElement} The rendered `Card` component.
 *
 * @example
 * <Card padding="lg" className="bg-blue-100">
 *   <h2>Card Title</h2>
 *   <p>This is the card content.</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md border border-gray-200
        transition-all duration-150
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
