import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Alert } from '@/components/ui/Alert'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { parseApiError } from '@/lib/apiErrors'
import {
  AUDIENCE_TYPES,
  NOTIFICATION_PRIORITIES,
  buildCreatePayload,
  emptyComposeForm,
  notificationsAdminService,
  targetFieldFor,
  validateComposeForm,
  type AudienceRow,
  type AudienceType,
  type ComposeForm,
  type NotificationPriority,
} from '@/services/notificationsAdmin'

const selectClass = 'w-full rounded-2xl border border-surface-border px-3 py-2 bg-white'

const AudienceEditor: React.FC<{
  row: AudienceRow
  onChange: (row: AudienceRow) => void
  onRemove: () => void
  canRemove: boolean
}> = ({ row, onChange, onRemove, canRemove }) => {
  const field = targetFieldFor(row.type)
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['notification-audience-lookup', field, debounced],
    queryFn: () => notificationsAdminService.lookupFor(field!, debounced),
    enabled: !!field,
  })

  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-end p-3 border border-surface-border rounded-2xl">
      <div className="md:w-48">
        <label className="block text-sm font-medium text-ink-secondary mb-1" htmlFor={`audience-type-${row.key}`}>
          Audience
        </label>
        <select
          id={`audience-type-${row.key}`}
          className={selectClass}
          value={row.type}
          onChange={(event) => onChange({ ...row, type: event.target.value as AudienceType, targetId: '' })}
        >
          {AUDIENCE_TYPES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {field && (
        <>
          <div className="md:w-56">
            <Input
              id={`audience-search-${row.key}`}
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type to narrow the list"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink-secondary mb-1" htmlFor={`audience-target-${row.key}`}>
              Target
            </label>
            <select
              id={`audience-target-${row.key}`}
              className={selectClass}
              value={row.targetId}
              onChange={(event) => onChange({ ...row, targetId: event.target.value })}
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading...' : 'Select...'}</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {canRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove audience">
          Remove
        </Button>
      )}
    </div>
  )
}

interface ComposeModalProps {
  onClose: () => void
}

/**
 * Compose a notification: save as a draft (notifications.admin.create) or send now
 * (also needs notifications.admin.send, confirmed first).
 */
export const NotificationComposeModal: React.FC<ComposeModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ComposeForm>(emptyComposeForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)
  const [nextKey, setNextKey] = useState(2)

  const createMutation = useMutation({
    mutationFn: (sendNow: boolean) => notificationsAdminService.create(buildCreatePayload(form, sendNow)),
    onSuccess: (_created, sendNow) => {
      queryClient.invalidateQueries({ queryKey: ['notifications-admin'] })
      toast.success(sendNow ? 'Notification queued for delivery' : 'Draft saved')
    },
  })

  const update = <K extends keyof ComposeForm>(key: K, value: ComposeForm[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): boolean => {
    const found = validateComposeForm(form)
    setErrors(found)
    setServerError(null)
    return Object.keys(found).length === 0
  }

  const saveDraft = async () => {
    if (!validate()) return
    try {
      await createMutation.mutateAsync(false)
      onClose()
    } catch (error) {
      const info = parseApiError(error)
      setErrors(info.fieldErrors)
      setServerError(info.message)
    }
  }

  const startSend = () => {
    if (validate()) setConfirmSend(true)
  }

  return (
    <>
      <Modal title="New notification" onClose={onClose} size="lg">
        <div className="space-y-4">
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <Input id="notif-title" label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} error={errors.title} required maxLength={255} />
          <TextArea id="notif-body" label="Message" value={form.body} onChange={(e) => update('body', e.target.value)} error={errors.body} rows={5} required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="notif-category" label="Category" list="notif-category-options" value={form.category} onChange={(e) => update('category', e.target.value)} error={errors.category} required maxLength={64} />
            <datalist id="notif-category-options">
              {['General', 'Academic', 'Exam', 'Finance', 'Timetable', 'Event'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-1" htmlFor="notif-priority">
                Priority
              </label>
              <select id="notif-priority" className={selectClass} value={form.priority} onChange={(e) => update('priority', e.target.value as NotificationPriority)}>
                {NOTIFICATION_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <Input id="notif-publish" type="datetime-local" label="Publish at (optional)" value={form.publishAt} onChange={(e) => update('publishAt', e.target.value)} helperText="Leave empty to publish as soon as it is sent." />
            <Input id="notif-expires" type="datetime-local" label="Expires at (optional)" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)} error={errors.expiresAt} />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => update('sendEmail', e.target.checked)} />
            Also send by email
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-secondary">Audience</p>
            {form.audiences.map((row) => (
              <AudienceEditor
                key={row.key}
                row={row}
                canRemove={form.audiences.length > 1}
                onChange={(next) => update('audiences', form.audiences.map((r) => (r.key === row.key ? next : r)))}
                onRemove={() => update('audiences', form.audiences.filter((r) => r.key !== row.key))}
              />
            ))}
            {errors.audiences && <p className="text-sm text-danger">{errors.audiences}</p>}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                update('audiences', [...form.audiences, { key: nextKey, type: 'ALL_STUDENTS', targetId: '' }])
                setNextKey(nextKey + 1)
              }}
            >
              Add audience
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Can tasks={['notifications.admin.create']}>
              <Button variant="secondary" onClick={saveDraft} isLoading={createMutation.isPending && !confirmSend}>
                Save as draft
              </Button>
            </Can>
            <Can tasks={['notifications.admin.send']}>
              <Button onClick={startSend} disabled={createMutation.isPending}>
                Send now
              </Button>
            </Can>
          </div>
        </div>
      </Modal>

      {confirmSend && (
        <ConfirmDialog
          title="Send notification now?"
          message={
            <>
              This queues <strong>{form.title.trim()}</strong> for delivery to its audience
              {form.sendEmail ? ', including by email' : ''}. It cannot be recalled once sent.
            </>
          }
          confirmLabel="Send now"
          onClose={() => setConfirmSend(false)}
          onConfirm={async () => {
            await createMutation.mutateAsync(true)
            onClose()
          }}
        />
      )}
    </>
  )
}
