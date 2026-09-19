import React from 'react'
import { Navigate } from 'react-router-dom'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/useAuth'
import { useAuthStore } from '@/features/auth/authStore'
import { landingPathFor } from '@/features/auth/access'

/**
 * `/dashboard` sends each signed-in user to their role's landing page using the
 * explicit map in `features/auth/access.ts`.  Users with no mapped role see an
 * explanation instead of being redirected in a loop.
 */
export const DashboardHome: React.FC = () => {
  const { user } = useAuth()
  const roles = useAuthStore((state) => state.roles)

  const landing = landingPathFor(user?.role, roles)
  if (landing) {
    return <Navigate to={landing} replace />
  }

  return (
    <PageShell title="Welcome" description="Your account is signed in but has no dashboard yet.">
      <Card>
        <div className="p-8 text-center">
          <p className="text-ink-secondary max-w-md mx-auto">
            No role has been assigned to your account, so there is no dashboard to show. Please contact an
            administrator to have a role assigned.
          </p>
        </div>
      </Card>
    </PageShell>
  )
}
