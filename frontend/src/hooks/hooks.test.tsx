import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'
import { useUnreadNotificationsCount } from './useUnreadNotificationsCount'

const mocks = vi.hoisted(() => ({ blocker: vi.fn(), query: vi.fn(), unread: vi.fn(), user: { id: 7, password_change_required: false } as { id: number; password_change_required: boolean } | null }))
vi.mock('@/features/auth/authStore', () => ({ useAuthStore: (selector: (state: { user: typeof mocks.user }) => unknown) => selector({ user: mocks.user }) }))
vi.mock('react-router-dom', () => ({ useBlocker: mocks.blocker }))
vi.mock('@tanstack/react-query', () => ({ useQuery: mocks.query }))
vi.mock('@/services/notifications', () => ({ notificationsService: { getUnreadCount: mocks.unread } }))
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks() })

it('debounces rapid changes and cancels obsolete timers on unmount', () => {
  vi.useFakeTimers()
  const { result, rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value), { initialProps: { value: 'a' } })
  rerender({ value: 'b' })
  act(() => vi.advanceTimersByTime(200))
  rerender({ value: 'c' })
  act(() => vi.advanceTimersByTime(299))
  expect(result.current).toBe('a')
  act(() => vi.advanceTimersByTime(1))
  expect(result.current).toBe('c')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

describe('keyboard navigation', () => {
  it.each(['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])('dispatches %s only to a registered handler', key => {
    const element = document.createElement('div')
    const callback = vi.fn()
    const ref = { current: element }
    const { rerender, unmount } = renderHook(({ enabled, handler }) => useKeyboardNavigation(ref, { enabled, [`on${key}`]: handler }), { initialProps: { enabled: true, handler: callback as (() => void) | undefined } })
    const event = new KeyboardEvent('keydown', { key, cancelable: true })
    element.dispatchEvent(event)
    expect(callback).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
    rerender({ enabled: true, handler: undefined })
    const unhandled = new KeyboardEvent('keydown', { key, cancelable: true })
    element.dispatchEvent(unhandled)
    expect(unhandled.defaultPrevented).toBe(false)
    rerender({ enabled: false, handler: callback })
    element.dispatchEvent(new KeyboardEvent('keydown', { key }))
    expect(callback).toHaveBeenCalledOnce()
    unmount()
    element.dispatchEvent(new KeyboardEvent('keydown', { key }))
    expect(callback).toHaveBeenCalledOnce()
  })
  it('ignores unsupported keys and absent elements', () => {
    const element = document.createElement('div')
    const { unmount } = renderHook(() => useKeyboardNavigation({ current: element }))
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
    element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    unmount()
    const missing = renderHook(() => useKeyboardNavigation({ current: null! }))
    missing.unmount()
  })
})

it('protects dirty navigation, allows same-route changes, and bypasses a saved navigation', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const { result, rerender, unmount } = renderHook(({ dirty }) => useUnsavedChangesWarning(dirty), { initialProps: { dirty: false } })
  const transition = { currentLocation: { pathname: '/edit' }, nextLocation: { pathname: '/list' } }
  const blocked = (value = transition) => mocks.blocker.mock.lastCall![0](value)
  expect(blocked()).toBe(false)
  rerender({ dirty: true })
  expect(blocked()).toBe(true)
  expect(blocked({ ...transition, nextLocation: transition.currentLocation })).toBe(false)
  confirm.mockReturnValue(true)
  expect(blocked()).toBe(false)
  const close = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(close)
  expect(close.defaultPrevented).toBe(true)
  confirm.mockReturnValue(false)
  result.current.bypassNext()
  expect(blocked()).toBe(false)
  unmount()
  const after = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(after)
  expect(after.defaultPrevented).toBe(false)
})

it('shares notification polling and defaults an absent count to zero', async () => {
  mocks.query.mockReturnValue({ data: undefined })
  const { result, rerender } = renderHook(useUnreadNotificationsCount, { initialProps: { refresh: false } })
  expect(result.current).toBe(0)
  mocks.query.mockReturnValue({ data: { count: 4 } })
  rerender({ refresh: true })
  expect(result.current).toBe(4)
  const options = mocks.query.mock.lastCall![0]
  expect(options.queryKey).toEqual(['notifications-unread-count', 7])
  expect(options.refetchInterval).toBe(30000)
  expect(options.enabled).toBe(true)
  mocks.user = { id: 7, password_change_required: true }
  rerender({ refresh: false })
  expect(result.current).toBe(0)
  expect(mocks.query.mock.lastCall![0].enabled).toBe(false)
  mocks.user = null
  rerender({ refresh: true })
  expect(result.current).toBe(0)
  expect(mocks.query.mock.lastCall![0].enabled).toBe(false)
  mocks.unread.mockResolvedValue({ count: 5 })
  expect(await options.queryFn()).toEqual({ count: 5 })
})
