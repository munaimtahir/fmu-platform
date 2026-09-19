import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'

vi.mock('@/api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import api from '@/api/axios'
import { downloadFile, filenameFromContentDisposition } from './download'
import { parseApiError } from './apiErrors'

describe('filenameFromContentDisposition', () => {
  it.each([
    ['attachment; filename="voucher_V-1.pdf"', 'voucher_V-1.pdf'],
    ['attachment; filename=receipt.pdf', 'receipt.pdf'],
    ["attachment; filename*=UTF-8''na%C3%AFve%20file.pdf", 'naïve file.pdf'],
  ])('parses %s', (header, expected) => {
    expect(filenameFromContentDisposition(header)).toBe(expected)
  })

  it('returns undefined when there is no header or filename', () => {
    expect(filenameFromContentDisposition(undefined)).toBeUndefined()
    expect(filenameFromContentDisposition('inline')).toBeUndefined()
  })
})

describe('downloadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:x')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('requests a blob through the authenticated client and saves it under the server filename', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(api.get).mockResolvedValue({
      data: new Blob(['pdf']),
      headers: { 'content-disposition': 'attachment; filename="receipt_R1.pdf"' },
    })

    const name = await downloadFile('/api/finance/payments/1/pdf/', { filename: 'fallback.pdf' })

    expect(api.get).toHaveBeenCalledWith('/api/finance/payments/1/pdf/', { params: undefined, responseType: 'blob' })
    expect(name).toBe('receipt_R1.pdf')
    expect(click).toHaveBeenCalledTimes(1)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })

  it('falls back to the supplied filename', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['x']), headers: {} })
    expect(await downloadFile('/api/x/', { filename: 'report.csv' })).toBe('report.csv')
  })

  it('supports POST downloads with a body', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(api.post).mockResolvedValue({ data: new Blob(['x']), headers: {} })
    await downloadFile('/api/finance/reports/defaulters/', { method: 'post', data: { a: 1 }, params: { format: 'csv' } })
    expect(api.post).toHaveBeenCalledWith('/api/finance/reports/defaulters/', { a: 1 }, { params: { format: 'csv' }, responseType: 'blob' })
  })

  it('decodes a blob error body so the server message survives', async () => {
    const error = new AxiosError('Forbidden')
    error.response = {
      status: 403,
      data: new Blob([JSON.stringify({ error: { code: 'FINANCE_BLOCKED', message: 'Outstanding dues' } })]),
      statusText: '',
      headers: {},
      config: {} as never,
    }
    vi.mocked(api.get).mockRejectedValue(error)

    const caught = await downloadFile('/api/transcripts/1/').catch((e) => e)

    expect(parseApiError(caught)).toMatchObject({ status: 403, code: 'FINANCE_BLOCKED', message: 'Outstanding dues' })
  })
})
