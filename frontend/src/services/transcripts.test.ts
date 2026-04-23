import { describe, expect, it, vi, beforeEach } from 'vitest'
import api from '@/api/axios'
import { transcriptsService } from './transcripts'

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('transcriptsService verification contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies transcript tokens through the public verification endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { valid: false, reason: 'Token signature is invalid (tampered)' },
    })

    const result = await transcriptsService.verify('bad token')

    expect(api.get).toHaveBeenCalledWith('/api/transcripts/verify/bad%20token/')
    expect(result.valid).toBe(false)
  })
})
