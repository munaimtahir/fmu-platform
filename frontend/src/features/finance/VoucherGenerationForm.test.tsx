import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VoucherGenerationForm } from './VoucherGenerationForm'

describe('VoucherGenerationForm', () => {
  it('requires term and due date', async () => {
    const onSubmit = vi.fn()
    render(<VoucherGenerationForm onSubmit={onSubmit} />)

    const button = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(button)

    expect(await screen.findByText(/Term and due date are required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
