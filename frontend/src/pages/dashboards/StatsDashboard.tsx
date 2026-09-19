import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/features/auth/useAuth'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { getRouteAccess } from '@/config/routeAccess'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { apiErrorMessage } from '@/lib/apiErrors'

export interface StatDefinition {
  key: keyof DashboardStats
  label: string
  icon: string
}

export interface QuickLink {
  label: string
  path: string
  description: string
}

interface StatsDashboardProps {
  title: string
  /** Sentence shown under the title; the user's name is prepended. */
  subtitle: string
  stats: StatDefinition[]
  links: QuickLink[]
}

const formatNumber = (value: number) => value.toLocaleString()

/**
 * Backend-driven dashboard for roles that only need counts and shortcuts
 * (Registrar, ExamCell, Coordinator, Office assistant).  Every number comes
 * from /api/dashboard/stats/; a stat the backend did not return is not shown,
 * and shortcuts are only shown for routes the user can actually open.
 */
export const StatsDashboard: React.FC<StatsDashboardProps> = ({ title, subtitle, stats, links }) => {
  const { user } = useAuth()
  const { allows } = useCapabilities()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  })

  const visibleLinks = links.filter((link) => allows(getRouteAccess(link.path)))
  const visibleStats = data ? stats.filter((stat) => typeof data[stat.key] === 'number') : []

  return (
    <PageShell title={title} description={`Welcome, ${user?.full_name || user?.username || 'there'}. ${subtitle}`}>
      {isLoading && <LoadingState message="Loading dashboard..." />}

      {isError && (
        <ErrorState
          title="Could not load dashboard"
          message={apiErrorMessage(error, 'Failed to load dashboard data')}
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <>
          {data.message && <Alert variant="info">{data.message}</Alert>}

          {visibleStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stat-grid">
              {visibleStats.map((stat) => (
                <Card key={stat.key}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink-secondary mb-1">{stat.label}</p>
                      <p className="text-h2 text-ink-primary">{formatNumber(data[stat.key] as number)}</p>
                    </div>
                    <div className="w-12 h-12 bg-info-subtle rounded-lg flex items-center justify-center text-2xl" aria-hidden="true">
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            !data.message && (
              <Card>
                <EmptyState icon="📊" title="No statistics available" description="There is nothing to summarise for your account yet." />
              </Card>
            )
          )}
        </>
      )}

      {visibleLinks.length > 0 && (
        <Card>
          <h2 className="text-h3 text-ink-primary mb-4">Quick links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block p-4 border border-surface-border rounded-2xl hover:bg-surface transition-colors"
              >
                <p className="font-medium text-ink-primary">{link.label}</p>
                <p className="text-sm text-ink-secondary">{link.description}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  )
}
