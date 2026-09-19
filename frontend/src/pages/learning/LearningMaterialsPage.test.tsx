import { describe, expect, it } from 'vitest'
import { formatFileSize } from '@/services/learning'

describe('learning materials behavior', () => {
  it('formats material file sizes for the workflow UI', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
  })
})
