import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

/**
 * ProtectedRoute - Route guard that ensures user is authenticated and authorized
 * Redirects to login if not authenticated
 * Redirects to unauthorized page if user lacks required role
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, initialize } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Initialize auth state on mount
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = user?.role && allowedRoles.includes(user.role)
    if (!hasRequiredRole) {
      // Redirect to main dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
