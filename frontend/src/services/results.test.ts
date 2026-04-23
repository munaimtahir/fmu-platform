import { describe, expect, it, vi, beforeEach } from 'vitest'
import api from '@/api/axios'
import { resultsService } from './results'

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('resultsService workflow contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the canonical result-header list endpoint with supported filters', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { results: [], count: 0 } })

    await resultsService.getAll({ status: 'DRAFT', search: 'MBBS' })

    expect(api.get).toHaveBeenCalledWith('/api/results/', {
      params: { status: 'DRAFT', search: 'MBBS' },
    })
  })

  it('publishes a result through the detail workflow action', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 7, status: 'PUBLISHED' } })

    await resultsService.publish(7)

    expect(api.post).toHaveBeenCalledWith('/api/results/7/publish/')
  })

  it('freezes a result through the detail workflow action', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 7, status: 'FROZEN' } })

    await resultsService.freeze(7)

    expect(api.post).toHaveBeenCalledWith('/api/results/7/freeze/')
  })
})
