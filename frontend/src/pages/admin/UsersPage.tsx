import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { usersApi, type AdminUser, type CreateUserData, type UpdateUserData } from '@/api/users'

const ROLES = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']

/**
 * UsersPage - Admin user management
 */
export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<{ role?: string; is_active?: boolean; q?: string }>({})
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    role: 'STUDENT',
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => usersApi.getAll({ ...filters, page_size: 1000 }),
  })

  const users = usersData?.results || []

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateUserData | UpdateUserData) => {
      if (editingUser) {
        return usersApi.update(editingUser.id, data as UpdateUserData)
      }
      return usersApi.create(data as CreateUserData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowForm(false)
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_active: true,
        role: 'STUDENT',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => usersApi.resetPassword(id),
    onSuccess: (data) => {
      setTempPassword(data.temporary_password)
      setShowPasswordModal(true)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  // Activate/Deactivate mutations
  const activateMutation = useMutation({
    mutationFn: (id: number) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '', // Don't prefill password
      is_active: user.is_active,
      role: user.role || 'STUDENT',
    })
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleResetPassword = (id: number) => {
    if (window.confirm('Reset password for this user? A temporary password will be generated.')) {
      resetPasswordMutation.mutate(id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      <PageShell title="User Management" description="Manage system users and their roles">
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Search"
                  placeholder="Search by name, email, username..."
                  value={filters.q || ''}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
                />

                <Select
                  label="Role"
                  value={filters.role || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, role: e.target.value || undefined })
                  }
                >
                  <option value="">All Roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Status"
                  value={filters.is_active?.toString() || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setFilters({
                      ...filters,
                      is_active: val === '' ? undefined : val === 'true',
                    })
                  }}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>

                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => setFilters({})}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Users</h2>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setFormData({
                      username: '',
                      email: '',
                      first_name: '',
                      last_name: '',
                      password: '',
                      is_active: true,
                      role: 'STUDENT',
                    })
                    setShowForm(true)
                  }}
                >
                  Add User
                </Button>
              </div>

              {isLoading ? (
                <LoadingState />
              ) : users.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No users found"
                  description="Create a new user to get started"
                />
              ) : (
                <SimpleTable
                  data={users}
                  columns={[
                    {
                      key: 'username',
                      label: 'Username',
                    },
                    {
                      key: 'full_name',
                      label: 'Name',
                    },
                    {
                      key: 'email',
                      label: 'Email',
                    },
                    {
                      key: 'role',
                      label: 'Role',
                      render: (user: AdminUser) => (
                        <Badge variant="default">{user.role}</Badge>
                      ),
                    },
                    {
                      key: 'is_active',
                      label: 'Status',
                      render: (user: AdminUser) => (
                        <Badge variant={user.is_active ? 'success' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      ),
                    },
                    {
                      key: 'last_login',
                      label: 'Last Login',
                      render: (user: AdminUser) => formatDate(user.last_login),
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (user: AdminUser) => (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={resetPasswordMutation.isPending}
                          >
                            Reset Password
                          </Button>
                          {user.is_active ? (
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => deactivateMutation.mutate(user.id)}
                              disabled={deactivateMutation.isPending}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => activateMutation.mutate(user.id)}
                              disabled={activateMutation.isPending}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  keyField="id"
                />
              )}
            </div>
          </Card>

          {/* Create/Edit Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {editingUser ? 'Edit User' : 'Create User'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Username *"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />

                      <Input
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />

                      <Input
                        label="Last Name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>

                    {!editingUser && (
                      <Input
                        label="Password *"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Role *"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>

                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) =>
                              setFormData({ ...formData, is_active: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowForm(false)
                          setEditingUser(null)
                          setFormData({
                            username: '',
                            email: '',
                            first_name: '',
                            last_name: '',
                            password: '',
                            is_active: true,
                            role: 'STUDENT',
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}

          {/* Temporary Password Modal */}
          {showPasswordModal && tempPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Temporary Password</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Share this temporary password with the user. They should change it on first login.
                  </p>
                  <div className="bg-gray-100 p-4 rounded mb-4">
                    <code className="text-lg font-mono">{tempPassword}</code>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        alert('Password copied to clipboard!')
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordModal(false)
                        setTempPassword(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </PageShell>
    </DashboardLayout>
  )
}
