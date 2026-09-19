import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { apiErrorMessage, parseApiError } from '@/lib/apiErrors'
import { rbacService, type Role } from '@/services/rbac'

export const ROLES_KEY = ['rbac-roles']

interface RoleFormProps {
  role: Role | null
  onClose: () => void
}

const RoleForm: React.FC<RoleFormProps> = ({ role, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')

  const save = useMutation({
    mutationFn: () =>
      role
        ? rbacService.updateRole(role.id, role.is_system_role ? { description } : { name: name.trim(), description })
        : rbacService.createRole({ name: name.trim(), description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY })
      toast.success(role ? 'Role updated' : 'Role created')
      onClose()
    },
  })

  const info = save.error ? parseApiError(save.error, 'Failed to save role') : null

  return (
    <Modal title={role ? 'Edit role' : 'Create role'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={!!role?.is_system_role}
          error={info?.fieldErrors.name}
          helperText={role?.is_system_role ? 'System roles cannot be renamed.' : undefined}
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          error={info?.fieldErrors.description}
        />
        {info && !Object.keys(info.fieldErrors).length && <Alert variant="error">{info.message}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending} disabled={!name.trim() || save.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const RolesTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { can } = useCapabilities()
  const [search, setSearch] = useState('')
  const [formRole, setFormRole] = useState<Role | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Role | null>(null)

  const canCreate = can('core.roles.create')
  const canUpdate = can('core.roles.update')
  const canDelete = can('core.roles.delete')

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ROLES_KEY, queryFn: () => rbacService.listRoles() })

  const remove = useMutation({
    mutationFn: (id: number) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY })
      toast.success('Role deleted')
    },
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={apiErrorMessage(error, 'Failed to load roles')} onRetry={() => refetch()} />

  const needle = search.trim().toLowerCase()
  const roles = (data ?? []).filter(
    (role) => !needle || role.name.toLowerCase().includes(needle) || role.description.toLowerCase().includes(needle)
  )

  return (
    <div className="space-y-4">
      <Alert variant="info">
        Built-in roles also receive access from the system catalog. Explicit task assignments add to that access and
        cannot remove it.
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Search roles"
          placeholder="Search roles..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-64"
        />
        {canCreate && (
          <Button
            onClick={() => {
              setFormRole(null)
              setFormOpen(true)
            }}
          >
            Create Role
          </Button>
        )}
      </div>

      {roles.length === 0 ? (
        <EmptyState icon="🔐" title="No roles found" description={needle ? 'Try adjusting your search' : 'No roles exist yet'} />
      ) : (
        <ul className="space-y-3">
          {roles.map((role) => (
            <li key={role.id} data-testid={`role-row-${role.id}`} className="border rounded-lg p-4 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-primary">{role.name}</span>
                    {role.is_system_role && <Badge variant="info">System</Badge>}
                    <Badge variant="default">{role.task_assignments.length} explicit tasks</Badge>
                  </div>
                  {role.description && <p className="text-sm text-ink-secondary mt-1">{role.description}</p>}
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setFormRole(role)
                        setFormOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={role.is_system_role}
                      title={role.is_system_role ? 'System roles cannot be deleted' : undefined}
                      onClick={() => setDeleting(role)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <RoleForm
          key={formRole?.id ?? 'new'}
          role={formRole}
          onClose={() => {
            setFormOpen(false)
            setFormRole(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete role"
          message={`Delete the role "${deleting.name}"? Users in a matching group lose the tasks it granted.`}
          confirmLabel="Delete role"
          variant="danger"
          onConfirm={() => remove.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
