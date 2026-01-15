/**
 * Impersonation Banner Component
 * 
 * Displays a persistent banner when impersonation is active.
 * Shows target user info and provides a stop button.
 */
import React from 'react'
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/components/ui/Button'

export const ImpersonationBanner: React.FC = () => {
  const { impersonation, stopImpersonation } = useAuthStore()

  if (!impersonation.active || !impersonation.target) {
    return null
  }

  const handleStop = async () => {
    await stopImpersonation()
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3 shadow-md border-b border-yellow-600 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-semibold">
            Impersonating: {impersonation.target.full_name} ({impersonation.target.role})
          </span>
        </div>
        <Button
          onClick={handleStop}
          variant="secondary"
          size="sm"
          className="bg-yellow-600 text-white border-yellow-700 hover:bg-yellow-700"
        >
          Stop Impersonation
        </Button>
      </div>
    </div>
  )
}
