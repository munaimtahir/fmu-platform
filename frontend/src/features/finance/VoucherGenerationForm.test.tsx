import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { VoucherGenerationForm } from './VoucherGenerationForm'

// The form now uses useUnsavedChangesWarning (react-router's useBlocker),
// which requires a data router context to render at all — a plain
// <MemoryRouter> throws "useBlocker used outside a data router" under
// React Router v7. Render through createMemoryRouter/RouterProvider instead.
function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }], { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('VoucherGenerationForm', () => {
  it('requires term and due date', async () => {
    const onSubmit = vi.fn()
    renderWithRouter(<VoucherGenerationForm onSubmit={onSubmit} />)

    const button = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(button)

    expect(await screen.findByText(/Term and due date are required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
