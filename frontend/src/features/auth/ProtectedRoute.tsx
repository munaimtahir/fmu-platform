import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useAuthStore } from './authStore'
import { canAccess } from './access'
import { Spinner } from '@/components/ui/Spinner'
import { getRouteAccess } from '@/config/routeAccess'

// Hoisted to module scope: creating this inside the component body would
// construct a brand-new lazy component on every render, causing React to
// treat it as a different component and remount/refetch it each time.
const UnauthorizedPage = React.lazy(() =>
  import('@/pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage }))
)

const RouteFallback = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

export interface ProtectedRouteProps {
  children: React.ReactNode
  /** The route's react-router path pattern; must be registered in `config/routeAccess.ts`. */
  path: string
}

/**
 * Route guard: authenticated, then authorized by the route's registered access rule.
 * - Not signed in: redirect to /login (401).
 * - Signed in but lacking the required tasks/roles, or route not registered: Unauthorized page (403).
 *   Unregistered routes fail closed so a new route can never ship open by accident.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, path }) => {
  const { isAuthenticated, isLoading, initialize } = useAuth()
  const roles = useAuthStore((state) => state.roles)
  const tasks = useAuthStore((state) => state.tasks)
  const accessLoaded = useAuthStore((state) => state.accessLoaded)
  const location = useLocation()

  useEffect(() => {
    // Initialize auth state on mount (no-op once the session and access context are loaded)
    initialize()
  }, [initialize])

  if (isLoading || (isAuthenticated && !accessLoaded)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-ink-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // 401: Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const access = getRouteAccess(path)
  if (!access && import.meta.env.DEV) {
    console.error(`Route "${path}" is not registered in config/routeAccess.ts; denying access.`)
  }

  if (!canAccess(access, { roles, tasks })) {
    // 403: Show unauthorized page (stays logged in but blocked)
    return (
      <React.Suspense fallback={<RouteFallback />}>
        <UnauthorizedPage />
      </React.Suspense>
    )
  }

  // All route page components are lazy-loaded (see routes/appRoutes.tsx);
  // this single Suspense boundary covers every protected route rather than
  // wrapping each one individually at the call site.
  return <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>
}
