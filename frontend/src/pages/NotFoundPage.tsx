import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/** Shown for any unknown protected URL (instead of silently redirecting to /dashboard). */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageShell title="Page not found">
      <Card>
        <div className="p-12 text-center">
          <div className="text-6xl mb-4" aria-hidden="true">🧭</div>
          <h2 className="text-h2 text-ink-primary mb-2">404 - Page not found</h2>
          <p className="text-ink-secondary mb-8 max-w-md mx-auto">
            The page you are looking for does not exist or has moved.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </PageShell>
  )
}
