import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useUnreadNotificationsCount } from './useUnreadNotificationsCount'

const state = vi.hoisted(() => ({ user: { id: 1, password_change_required: true }, fetch: vi.fn() }))
vi.mock('@/features/auth/authStore', () => ({ useAuthStore: (select: (value: typeof state) => unknown) => select(state) }))
vi.mock('@/services/notifications', () => ({ notificationsService: { getUnreadCount: state.fetch } }))

beforeEach(() => {
  state.user = { id: 1, password_change_required: true }
  state.fetch.mockReset().mockResolvedValue({ count: 3 })
})

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
}

it('does not call a protected API during mandatory password change', () => {
  const { result } = renderHook(() => useUnreadNotificationsCount(), { wrapper })
  expect(result.current).toBe(0)
  expect(state.fetch).not.toHaveBeenCalled()
})

it('loads notification counts after password change', async () => {
  state.user.password_change_required = false
  const { result } = renderHook(() => useUnreadNotificationsCount(), { wrapper })
  await waitFor(() => expect(result.current).toBe(3))
  expect(state.fetch).toHaveBeenCalledTimes(1)
})
