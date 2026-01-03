import React, { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * ProfilePage - User profile information display
 */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!user) {
    return (
      <DashboardLayout>
        <PageShell title="Profile">
          <div className="text-center py-12">
            <p className="text-gray-500">User information not available</p>
          </div>
        </PageShell>
      </DashboardLayout>
    )
  }

  const fields = [
    { label: 'Username', value: user.username, key: 'username' },
    { label: 'Email', value: user.email, key: 'email' },
    { label: 'Full Name', value: user.full_name || 'Not set', key: 'full_name' },
    { label: 'Role', value: user.role || 'User', key: 'role' },
    { label: 'Status', value: user.is_active ? 'Active' : 'Inactive', key: 'status' },
    ...(user.student_id ? [{ label: 'Student ID', value: user.student_id.toString(), key: 'student_id' }] : []),
  ]

  return (
    <DashboardLayout>
      <PageShell 
        title="My Profile"
        description="View and manage your account information"
      >
        <Card>
          <div className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold text-white text-2xl">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.full_name || user.email}
                </h2>
                <p className="text-sm text-gray-500">{user.role || 'User'}</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                      {field.value}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(field.value, field.key)}
                      className="flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      {copiedField === field.key ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    // TODO: Implement password change when backend endpoint is available
                    alert('Password change feature coming soon. Backend endpoint needed: POST /api/auth/change-password/')
                  }}
                  disabled
                  title="Coming soon - backend endpoint needed"
                >
                  Change Password
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    // TODO: Implement session management if needed
                    alert('Session management coming soon')
                  }}
                  disabled
                  title="Coming soon"
                >
                  Manage Sessions
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </PageShell>
    </DashboardLayout>
  )
}
