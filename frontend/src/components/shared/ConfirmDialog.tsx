import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextArea } from '@/components/ui/TextArea'
import { apiErrorMessage } from '@/lib/apiErrors'

export interface ConfirmDialogProps {
  title: string
  /** What will happen; state the consequence plainly. */
  message: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Use `danger` for destructive or hard-to-reverse actions. */
  variant?: 'primary' | 'danger'
  /** Ask for a non-empty reason and pass it to `onConfirm`. */
  requireReason?: boolean
  reasonLabel?: string
  /** Perform the action.  Throw (reject) to keep the dialog open and show the error. */
  onConfirm: (reason?: string) => Promise<unknown> | unknown
  onClose: () => void
}

/**
 * Confirmation step for sensitive mutations (reverse, cancel, reconcile, approve, publish...).
 * Stays open and shows the backend's message if the action fails; closes on success.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireReason = false,
  reasonLabel = 'Reason',
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = reason.trim()
  const canConfirm = !isPending && (!requireReason || trimmed.length > 0)

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsPending(true)
    setError(null)
    try {
      await onConfirm(requireReason ? trimmed : undefined)
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err))
      setIsPending(false)
    }
  }

  return (
    <Modal title={title} onClose={isPending ? () => undefined : onClose}>
      <div className="space-y-4">
        <div className="text-ink-secondary">{message}</div>
        {requireReason && (
          <TextArea
            id="confirm-reason"
            label={`${reasonLabel} (required)`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            disabled={isPending}
          />
        )}
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} isLoading={isPending} disabled={!canConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
