import { describe, expect, it, vi, afterEach } from 'vitest'
import { sameOriginPath, fileNameFromUrl } from './mediaUrl'
import { countOf, pageCount, resultsOf } from './pagination'
import { statusVariant } from './statusBadges'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('authenticated media boundaries', () => {
  it.each([null, undefined, '', 'http://[invalid', 'https://untrusted.example/private', 'javascript:alert(1)'])('rejects %s', value => {
    expect(sameOriginPath(value)).toBeNull()
  })
  it('keeps paths and queries but strips origin and fragments', () => {
    expect(sameOriginPath('/files/record.pdf?download=1#ignored')).toBe('/files/record.pdf?download=1')
    expect(sameOriginPath('https://trusted.example/files/a', ['https://trusted.example'])).toBe('/files/a')
    expect(sameOriginPath('//untrusted.example/a')).toBeNull()
  })
  it('decodes names and uses a safe fallback for missing or malformed names', () => {
    expect(fileNameFromUrl('/files/student%20record.pdf?token=x')).toBe('student record.pdf')
    for (const value of [null, undefined, '', '/', 'http://[invalid', '/%ZZ']) {
      expect(fileNameFromUrl(value, 'fallback.pdf')).toBe('fallback.pdf')
    }
    expect(fileNameFromUrl(null)).toBe('download')
  })
})

describe('pagination contracts', () => {
  it('supports empty, bare and paginated responses without losing total count', () => {
    expect(resultsOf(undefined)).toEqual([])
    expect(countOf(undefined)).toBe(0)
    expect(resultsOf([1, 2])).toEqual([1, 2])
    expect(countOf([1, 2])).toBe(2)
    const response = { results: [1], count: 31, next: '/?page=2', previous: null }
    expect(resultsOf(response)).toEqual([1])
    expect(countOf(response)).toBe(31)
    expect(pageCount(0, 10)).toBe(1)
    expect(pageCount(30, 10)).toBe(3)
    expect(pageCount(31, 10)).toBe(4)
  })
})

it('keeps finance lifecycle colors distinct and tolerates new backend statuses', () => {
  expect(statusVariant('finance', 'paid')).toBe('success')
  expect(statusVariant('finance', 'overdue')).toBe('danger')
  expect(statusVariant('results', 'VERIFIED')).toBe('info')
  expect(statusVariant('student', 'Pending')).toBe('warning')
  expect(statusVariant('record', null)).toBe('default')
  expect(statusVariant('record', undefined)).toBe('default')
  expect(statusVariant('record', 'future-status')).toBe('default')
})

it.each([['https://api.example', 'https://api.example'], ['', 'http://localhost:8000']])('resolves environment API URL %s', async (value, expected) => {
  vi.stubEnv('VITE_API_URL', value)
  const { env, API_URL } = await import('./env')
  expect(env.apiBaseUrl).toBe(expected)
  expect(API_URL).toBe(expected)
})
