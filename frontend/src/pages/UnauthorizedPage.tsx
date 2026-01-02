import React from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * UnauthorizedPage - Shown when user tries to access a route they don't have permission for
 */
export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <DashboardLayout>
      <PageShell title="Access Denied">
        <Card>
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You don't have permission to access this page. If you believe this is an error, 
              please contact your administrator.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </PageShell>
    </DashboardLayout>
  )
}
