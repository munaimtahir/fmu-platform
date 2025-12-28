import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('should render with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should render without label', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(<Input label="Email" error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('should display helper text', () => {
    render(<Input label="Email" helperText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('should have error styles when error is present', () => {
    render(<Input label="Email" error="Invalid email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('border-red-500')
  })

  it('should be accessible', () => {
    render(<Input label="Email" error="Error message" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
  })
})
