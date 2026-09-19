import { describe, it, expect } from 'vitest'
import { toFormData } from './multipart'
import { countOf, pageCount, resultsOf } from './pagination'

describe('toFormData', () => {
  it('skips null/undefined, stringifies scalars and keeps files as blobs', () => {
    const file = new File(['abc'], 'b-form.pdf', { type: 'application/pdf' })
    const form = toFormData({ title: 'B-Form', amount: 5, active: false, note: null, missing: undefined, file })
    expect(form.get('title')).toBe('B-Form')
    expect(form.get('amount')).toBe('5')
    expect(form.get('active')).toBe('false')
    expect(form.has('note')).toBe(false)
    expect(form.has('missing')).toBe(false)
    expect((form.get('file') as File).name).toBe('b-form.pdf')
  })

  it('repeats the key for arrays (DRF multi-value fields)', () => {
    const form = toFormData({ groups: [1, 2, 3] })
    expect(form.getAll('groups')).toEqual(['1', '2', '3'])
  })
})

describe('pagination helpers', () => {
  const page = { count: 25, next: null, previous: null, results: [1, 2] }
  it('reads paginated envelopes and bare arrays', () => {
    expect(resultsOf(page)).toEqual([1, 2])
    expect(resultsOf([3, 4])).toEqual([3, 4])
    expect(resultsOf(undefined)).toEqual([])
    expect(countOf(page)).toBe(25)
    expect(countOf([1, 2, 3])).toBe(3)
  })
  it('computes at least one page', () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(41, 20)).toBe(3)
  })
})
