import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'
import { canAccessRoute } from '@/config/navConfig'

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  path?: string // Optional path for route policy checking
}

/**
 * ProtectedRoute - Route guard that ensures user is authenticated and authorized
 * Redirects to login if not authenticated (401)
 * Shows unauthorized page if user lacks required role (403)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  path 
}) => {
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
    // 401: Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  // First check explicit allowedRoles prop, then check route policy if path provided
  const routePath = path || location.pathname
  let hasAccess = true

  if (allowedRoles && allowedRoles.length > 0) {
    // Explicit role check from route definition
    hasAccess = user?.role ? allowedRoles.includes(user.role) : false
  } else if (path || location.pathname) {
    // Use route policy from navConfig
    hasAccess = canAccessRoute(user?.role, routePath)
  }

  if (!hasAccess) {
    // 403: Show unauthorized page (stays logged in but blocked)
    // Import dynamically to avoid circular dependencies
    const UnauthorizedPage = React.lazy(() => 
      import('@/pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage }))
    )
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }>
        <UnauthorizedPage />
      </React.Suspense>
    )
  }

  return <>{children}</>
}
