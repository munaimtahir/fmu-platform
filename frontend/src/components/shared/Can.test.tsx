import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Can } from './Can'
import { useAuthStore } from '@/features/auth/authStore'
import type { RoleName } from '@/features/auth/access'

function withAccess(roles: RoleName[], tasks: string[]) {
  useAuthStore.setState({ roles, tasks, accessLoaded: true })
}

describe('<Can>', () => {
  beforeEach(() => withAccess([], []))

  it('renders children when any listed task is held', () => {
    withAccess([], ['finance.vouchers.cancel'])
    render(<Can tasks={['finance.vouchers.cancel', 'finance.vouchers.delete']}>Cancel</Can>)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('hides children and shows the fallback when no task is held', () => {
    withAccess([], ['finance.vouchers.view'])
    render(
      <Can tasks={['finance.vouchers.cancel']} fallback={<span>read only</span>}>
        Cancel
      </Can>
    )
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    expect(screen.getByText('read only')).toBeInTheDocument()
  })

  it('supports role-based self-service controls', () => {
    withAccess(['Student'], [])
    render(<Can roles={['Student']}>Submit</Can>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('renders for everyone when no rule is given', () => {
    render(<Can>Always</Can>)
    expect(screen.getByText('Always')).toBeInTheDocument()
  })
})
