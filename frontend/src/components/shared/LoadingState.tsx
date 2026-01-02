import React from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

/**
 * LoadingState - Consistent loading indicator
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
