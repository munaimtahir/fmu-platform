import React from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

/**
 * UsersPage - User management information
 * Note: User management is currently handled via Django admin
 * This page provides information and future API integration placeholder
 */
export const UsersPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PageShell 
        title="User Management"
        description="Manage system users and their roles"
      >
        <div className="space-y-6">
          <Alert variant="info">
            <strong>Note:</strong> User management is currently handled via Django Admin interface. 
            A full user management API and UI will be implemented in a future release.
          </Alert>

          <Card>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Current User Management</h2>
              <p className="text-sm text-gray-600">
                Users are managed through the Django Admin interface at <code className="px-2 py-1 bg-gray-100 rounded">/admin/</code>
              </p>
              
              <div className="mt-6 space-y-4">
                <h3 className="text-md font-medium text-gray-900">Available Actions</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Create new users</li>
                  <li>Assign users to groups (roles)</li>
                  <li>Activate/deactivate user accounts</li>
                  <li>Reset user passwords</li>
                  <li>View user activity and permissions</li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-2">Future Enhancements</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Planned features for user management UI:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>List all users with search and filters</li>
                  <li>Create/edit users directly from the UI</li>
                  <li>Bulk user operations</li>
                  <li>User activity logs</li>
                  <li>Role assignment interface</li>
                </ul>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const adminUrl = `${window.location.origin}/admin/`
                    window.open(adminUrl, '_blank')
                  }}
                >
                  Open Django Admin
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </PageShell>
    </DashboardLayout>
  )
}
