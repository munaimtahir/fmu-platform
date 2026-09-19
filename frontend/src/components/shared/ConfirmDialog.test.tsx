import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { ConfirmDialog } from './ConfirmDialog'

function apiError(message: string) {
  const error = new AxiosError('failed')
  error.response = { status: 400, data: { error: { code: 'X', message } }, statusText: '', headers: {}, config: {} as never } as AxiosResponse
  return error
}

describe('ConfirmDialog', () => {
  it('runs the action, then closes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<ConfirmDialog title="Reconcile voucher" message="Recalculate status?" confirmLabel="Reconcile" onConfirm={onConfirm} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reconcile' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledWith(undefined)
  })

  it('requires a reason before it will confirm, and passes it trimmed', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<ConfirmDialog title="Cancel voucher" message="This reverses the ledger." confirmLabel="Cancel voucher" requireReason variant="danger" onConfirm={onConfirm} onClose={() => undefined} />)

    const confirm = screen.getByRole('button', { name: 'Cancel voucher' })
    expect(confirm).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/reason/i), '  Issued in error  ')
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Issued in error'))
  })

  it('keeps a whitespace-only reason from enabling the action', async () => {
    render(<ConfirmDialog title="T" message="M" confirmLabel="Go" requireReason onConfirm={vi.fn()} onClose={() => undefined} />)
    await userEvent.type(screen.getByLabelText(/reason/i), '   ')
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled()
  })

  it('stays open and shows the backend message when the action fails', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn().mockRejectedValue(apiError('Reverse the verified payments first.'))
    render(<ConfirmDialog title="T" message="M" confirmLabel="Go" onConfirm={onConfirm} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Go' }))

    expect(await screen.findByText('Reverse the verified payments first.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Go' })).toBeEnabled()
  })

  it('lets the user cancel without running the action', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<ConfirmDialog title="T" message="M" confirmLabel="Go" onConfirm={onConfirm} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
