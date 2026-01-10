import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { changePassword } from '@/api/auth'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

/**
 * ProfilePage - User profile information display
 */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Handle URL query parameter for password change
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'change-password') {
      setShowPasswordChange(true)
      // Remove query parameter from URL
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validation
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(passwordForm)
      setPasswordSuccess(true)
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      })
      setTimeout(() => {
        setShowPasswordChange(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setPasswordLoading(false)
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
                  onClick={() => setShowPasswordChange(true)}
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

        {/* Password Change Modal */}
        {showPasswordChange && (
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  Password changed successfully!
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="old_password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    required
                    minLength={8}
                    disabled={passwordLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
                </div>

                <div>
                  <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="new_password_confirm"
                    value={passwordForm.new_password_confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    required
                    disabled={passwordLoading}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={passwordLoading || passwordSuccess}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordChange(false)
                      setPasswordError(null)
                      setPasswordForm({
                        old_password: '',
                        new_password: '',
                        new_password_confirm: '',
                      })
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}
      </PageShell>
    </DashboardLayout>
  )
}
