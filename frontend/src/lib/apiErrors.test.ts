import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { apiErrorMessage, parseApiError } from './apiErrors'

function axiosError(status: number | undefined, data?: unknown): AxiosError {
  const error = new AxiosError('Request failed')
  if (status !== undefined) {
    error.response = { status, data, statusText: '', headers: {}, config: {} as never } as AxiosResponse
  }
  return error
}

describe('parseApiError', () => {
  it('reads the { error: { code, message } } shape', () => {
    const info = parseApiError(axiosError(400, { error: { code: 'ALREADY_CANCELLED', message: 'Voucher is already cancelled.' } }))
    expect(info).toMatchObject({ status: 400, code: 'ALREADY_CANCELLED', message: 'Voucher is already cancelled.' })
  })

  it('reads { error: "text" }, { detail } and { message }', () => {
    expect(parseApiError(axiosError(400, { error: 'Bad thing' })).message).toBe('Bad thing')
    expect(parseApiError(axiosError(403, { detail: 'Nope.' })).message).toBe('Nope.')
    expect(parseApiError(axiosError(400, { message: 'Hm' })).message).toBe('Hm')
  })

  it('maps DRF field errors to fields and builds a summary', () => {
    const info = parseApiError(axiosError(400, { reason: ['This field is required.'], amount: ['Too big', 'Too small'] }))
    expect(info.fieldErrors).toEqual({ reason: 'This field is required.', amount: 'Too big Too small' })
    expect(info.message).toBe('reason: This field is required.')
  })

  it('prefers non_field_errors as the message', () => {
    const info = parseApiError(axiosError(400, { non_field_errors: ['Dates overlap.'], start: ['Invalid'] }))
    expect(info.message).toBe('Dates overlap.')
    expect(info.fieldErrors).toEqual({ start: 'Invalid' })
  })

  it('explains permission, missing and server failures when the body has no message', () => {
    expect(parseApiError(axiosError(403)).message).toMatch(/permission/i)
    expect(parseApiError(axiosError(404)).message).toMatch(/could not be found/i)
    expect(parseApiError(axiosError(500)).message).toMatch(/server/i)
  })

  it('does not show raw HTML error pages', () => {
    expect(parseApiError(axiosError(502, '<html><body>Bad gateway</body></html>')).message).toMatch(/server/i)
  })

  it('flags network failures', () => {
    const info = parseApiError(axiosError(undefined))
    expect(info.isNetworkError).toBe(true)
    expect(info.message).toMatch(/reach the server/i)
  })

  it('handles plain errors, strings and unknown values', () => {
    expect(parseApiError(new Error('Local failure')).message).toBe('Local failure')
    expect(parseApiError('Text error').message).toBe('Text error')
    expect(parseApiError(undefined, 'Fallback').message).toBe('Fallback')
  })

  it('apiErrorMessage returns just the text', () => {
    expect(apiErrorMessage(axiosError(400, { detail: 'X' }))).toBe('X')
  })
})
