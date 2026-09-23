import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api/axios'
import { allPages } from './allPages'

vi.mock('@/api/axios', () => ({ default: { get: vi.fn() } }))

describe('complete paginated option lists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches subsequent pages while preserving filters', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { results: [{ id: 1 }], next: 'page=2' } })
      .mockResolvedValueOnce({ data: { results: [{ id: 2 }], next: null } })
    expect(await allPages('/choices/', { is_active: true })).toEqual([{ id: 1 }, { id: 2 }])
    expect(api.get).toHaveBeenNthCalledWith(2, '/choices/', { params: { page: 2, is_active: true } })
  })

  it('accepts an unpaginated list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ id: 3 }] })
    expect(await allPages('/choices/')).toEqual([{ id: 3 }])
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('reports a later-page failure instead of silently returning partial choices', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { results: [{ id: 1 }], next: 'page=2' } })
      .mockRejectedValueOnce(new Error('Unavailable'))
    await expect(allPages('/choices/')).rejects.toThrow('Unavailable')
  })
})
