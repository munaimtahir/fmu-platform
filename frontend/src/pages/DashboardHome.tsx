import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/features/auth/useAuth'
import { env } from '@/lib/env'

/**
 * `DashboardHome` is the main landing page for the dashboard.
 *
 * This component serves as the central hub for authenticated users. It displays
 * a welcome message, system health status, and quick action cards. It also
 * contains logic to automatically redirect users to their role-specific
 * dashboard based on their primary role.
 *
 * @component
 * @returns {React.ReactElement} The rendered `DashboardHome` component.
 *
 * @example
 * return <DashboardHome />
 */
export const DashboardHome: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [health, setHealth] = useState<{ status: string; service: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Role-based redirect logic
  useEffect(() => {
    if (user && user.role) {
      // Navigate to role-specific dashboard
      const dashboardPath = `/dashboard/${user.role.toLowerCase()}`
      navigate(dashboardPath, { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${env.apiBaseUrl}/health/`)
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Health check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  return (
    
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-h1 text-ink-primary mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!
          </h1>
          <p className="text-ink-secondary text-lg">
            Here&apos;s what&apos;s happening in your system today.
          </p>
        </div>

        {/* System Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 text-ink-primary">
              System Status
            </h2>
            {health && (
              <StatusBadge
                domain="health"
                status={health.status}
                label={health.status === 'ok' ? 'Operational' : 'Issues Detected'}
              />
            )}
          </div>
          
          {loading ? (
            <p className="text-ink-muted">Checking system health...</p>
          ) : health ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Backend Service:</span>
                <span className="font-medium text-ink-primary">{health.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">API Base URL:</span>
                <code className="text-xs bg-neutral-subtle px-2 py-1 rounded">{env.apiBaseUrl}</code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Status:</span>
                <span className="font-medium text-success">{health.status.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <Alert variant="warning">
              Unable to connect to backend services. Please check your connection.
            </Alert>
          )}
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-elevation-3 transition-shadow duration-150 cursor-pointer">
            <h3 className="text-h4 text-ink-primary mb-2">
              Stage-2 Complete ✓
            </h3>
            <p className="text-ink-secondary text-sm mb-4">
              Core UI layer with navigation, DataTable, and form components is now complete.
            </p>
            <Badge variant="success">Ready</Badge>
          </Card>

          <Card className="hover:shadow-elevation-3 transition-shadow duration-150">
            <h3 className="text-h4 text-ink-primary mb-2">
              What&apos;s Next?
            </h3>
            <ul className="text-sm text-ink-secondary space-y-2">
              <li>• Stage-3: Student Management</li>
              <li>• Stage-4: Course & Enrollment</li>
              <li>• Stage-5: Assessments & Results</li>
            </ul>
          </Card>

          <Card className="hover:shadow-elevation-3 transition-shadow duration-150">
            <h3 className="text-h4 text-ink-primary mb-2">
              API Documentation
            </h3>
            <p className="text-ink-secondary text-sm mb-4">
              Explore available endpoints and schemas.
            </p>
            <div className="flex gap-2">
              <a
                href={`${env.apiBaseUrl}/api/docs/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-blue-600 text-sm font-medium transition-colors duration-150"
              >
                Swagger UI →
              </a>
              <a
                href={`${env.apiBaseUrl}/api/redoc/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-blue-600 text-sm font-medium transition-colors duration-150"
              >
                ReDoc →
              </a>
            </div>
          </Card>
        </div>

        {/* User Info */}
        {user && (
          <Card>
            <h2 className="text-h3 text-ink-primary mb-4">
              Your Profile
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Email:</span>
                <span className="font-medium text-ink-primary">{user.email}</span>
              </div>
              {user.full_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Name:</span>
                  <span className="font-medium text-ink-primary">
                    {user.full_name}
                  </span>
                </div>
              )}
              {user.role && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">Role:</span>
                  <div className="flex gap-2">
                    <Badge variant="primary">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    
  )
}
