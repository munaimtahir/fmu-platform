import { describe, expect, it } from 'vitest'
import { availabilityOf, isSafeExternalUrl } from '@/services/learning'

describe('learning feed behavior', () => {
  it('accepts only http and https material links', () => {
    expect(isSafeExternalUrl('https://example.com/material')).toBe(true)
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
  })

  it('reports scheduled and expired availability', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(availabilityOf({ available_from: '2026-01-02T00:00:00Z', available_until: null }, now).state).toBe('scheduled')
    expect(availabilityOf({ available_from: null, available_until: '2025-12-31T00:00:00Z' }, now).state).toBe('expired')
  })
})
