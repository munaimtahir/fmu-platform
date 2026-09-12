import React from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * ErrorState - Consistent error display
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-h4 text-ink-primary mb-2">{title}</h3>
      <p className="text-sm text-ink-muted text-center max-w-md mb-6">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
        {action && (
          <Button onClick={action.onClick} variant="secondary">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
