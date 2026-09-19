import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { PaginationState } from '@/components/ui/DataTable/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { FormSection } from '@/components/ui/FormSection'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { Heading } from '@/components/ui/Typography'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { apiErrorMessage } from '@/lib/apiErrors'
import toast from 'react-hot-toast'
import { usersApi, type AdminUser, type CreateUserData, type UpdateUserData } from '@/api/users'
import { USER_ROLE_OPTIONS, roleValueFromLabel } from './userRoles'

type PendingAction = { kind: 'deactivate' | 'delete' | 'reset'; user: AdminUser }

const EMPTY_FORM_DATA: CreateUserData = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  is_active: true,
  role: 'STUDENT',
}

/**
 * UsersPage - Admin user management
 */
export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<{ role?: string; is_active?: boolean; q?: string }>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateUserData>(EMPTY_FORM_DATA)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)

  useUnsavedChangesWarning(showForm)

  // Fetch users (server-side pagination — filters/search are query params,
  // so every page reflects the full filtered result set, not just what's
  // currently loaded).
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', filters, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      usersApi.getAll({
        ...filters,
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
      }),
    placeholderData: (previousData) => previousData,
  })

  const users = usersData?.results || []
  const totalCount = usersData?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize))

  const updateFilters = (next: typeof filters) => {
    setFilters(next)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

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
      setFormData(EMPTY_FORM_DATA)
      toast.success('User saved')
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
      toast.success('User activated')
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, 'Failed to activate user')),
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
      role: roleValueFromLabel(user.role),
    })
    setShowForm(true)
  }

  const runPending = async ({ kind, user }: PendingAction) => {
    if (kind === 'delete') await deleteMutation.mutateAsync(user.id)
    else if (kind === 'deactivate') await deactivateMutation.mutateAsync(user.id)
    else await resetPasswordMutation.mutateAsync(user.id)
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

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
      },
      {
        accessorKey: 'full_name',
        header: 'Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <Badge variant="default">{row.original.role}</Badge>,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge domain="record" status={row.original.is_active ? 'Active' : 'Inactive'} />
        ),
      },
      {
        accessorKey: 'last_login',
        header: 'Last Login',
        cell: ({ row }) => formatDate(row.original.last_login),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPending({ kind: 'reset', user })}
                disabled={resetPasswordMutation.isPending}
              >
                Reset Password
              </Button>
              {user.is_active ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setPending({ kind: 'deactivate', user })}
                  disabled={deactivateMutation.isPending}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => activateMutation.mutate(user.id)}
                  disabled={activateMutation.isPending}
                >
                  Activate
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => setPending({ kind: 'delete', user })}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [resetPasswordMutation.isPending, deactivateMutation.isPending, activateMutation.isPending, deleteMutation.isPending]
  )

  return (
    
      <PageShell title="User Management" description="Manage system users and their roles">
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <div className="p-6">
              <Heading level={4} className="mb-4">Filters</Heading>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Search"
                  placeholder="Search by name, email, username..."
                  value={filters.q || ''}
                  onChange={(e) => updateFilters({ ...filters, q: e.target.value || undefined })}
                />

                <Select
                  label="Role"
                  value={filters.role || ''}
                  onChange={(value) =>
                    updateFilters({ ...filters, role: value || undefined })
                  }
                  options={[
                    { value: '', label: 'All Roles' },
                    ...USER_ROLE_OPTIONS,
                  ]}
                />

                <Select
                  label="Status"
                  value={filters.is_active?.toString() || ''}
                  onChange={(value) => {
                    updateFilters({
                      ...filters,
                      is_active: value === '' ? undefined : value === 'true',
                    })
                  }}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />

                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => updateFilters({})}
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
                <Heading level={4}>Users</Heading>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setFormData(EMPTY_FORM_DATA)
                    setShowForm(true)
                  }}
                >
                  Add User
                </Button>
              </div>

              <DataTable
                data={users}
                columns={columns}
                isLoading={isLoading}
                manualPagination
                pageCount={pageCount}
                totalCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            </div>
          </Card>

          {/* Create/Edit Form Modal */}
          {showForm && (
            <Modal
              title={editingUser ? 'Edit User' : 'Create User'}
              size="lg"
              onClose={() => {
                setShowForm(false)
                setEditingUser(null)
                setFormData(EMPTY_FORM_DATA)
              }}
            >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormSection title="Account Details">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                          disabled={!!editingUser}
                        />

                        <Input
                          label="Email"
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
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      )}
                    </FormSection>

                    <FormSection title="Access & Status">
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Role"
                          value={formData.role}
                          onChange={(value) => setFormData({ ...formData, role: value })}
                          required
                          options={USER_ROLE_OPTIONS}
                        />

                        <div className="flex items-center pt-6">
                          <Switch
                            label="Active"
                            checked={formData.is_active}
                            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                        </div>
                      </div>
                    </FormSection>

                    {saveMutation.isError && <Alert variant="error">{apiErrorMessage(saveMutation.error, 'Failed to save user')}</Alert>}

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowForm(false)
                          setEditingUser(null)
                          setFormData(EMPTY_FORM_DATA)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
            </Modal>
          )}

          {/* Temporary Password Modal */}
          {showPasswordModal && tempPassword && (
            <Modal
              title="Temporary Password"
              onClose={() => {
                setShowPasswordModal(false)
                setTempPassword(null)
              }}
            >
              <p className="text-body-sm text-ink-secondary mb-4">
                Share this temporary password with the user. They should change it on first login.
              </p>
              <div className="bg-neutral-subtle p-4 rounded mb-4">
                <code className="text-lg font-mono">{tempPassword}</code>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword)
                    toast.success('Password copied to clipboard')
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
            </Modal>
          )}

          {pending && (
            <ConfirmDialog
              title={
                pending.kind === 'delete' ? 'Delete user' : pending.kind === 'deactivate' ? 'Deactivate user' : 'Reset password'
              }
              message={
                pending.kind === 'reset'
                  ? `Reset the password for ${pending.user.username}? A temporary password will be generated.`
                  : pending.kind === 'deactivate'
                    ? `Deactivate ${pending.user.username}? They will no longer be able to sign in.`
                    : `Delete (deactivate) ${pending.user.username}? This removes their access.`
              }
              confirmLabel={pending.kind === 'reset' ? 'Reset password' : pending.kind === 'deactivate' ? 'Deactivate' : 'Delete'}
              variant={pending.kind === 'reset' ? 'primary' : 'danger'}
              onConfirm={() => runPending(pending)}
              onClose={() => setPending(null)}
            />
          )}
        </div>
      </PageShell>
    
  )
}
