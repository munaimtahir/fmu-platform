/**
 * Tests for Attendance Utilities
 * Covers payload building and status toggle logic
 */
import { describe, it, expect } from 'vitest'

// Helper functions for attendance operations
export function buildAttendancePayload(
  roster: Array<{ student_id: number; name: string; reg_no: string }>,
  statusMap: Record<number, 'PRESENT' | 'ABSENT'>
): Array<{ student_id: number; status: string }> {
  // Backend expects only absent students with status 'A' when using default_status='P'
  return roster
    .filter((s) => statusMap[s.student_id] === 'ABSENT')
    .map((s) => ({
      student_id: s.student_id,
      status: 'A',
    }))
}

export function toggleStudentStatus(
  statusMap: Record<number, 'PRESENT' | 'ABSENT'>,
  studentId: number
): Record<number, 'PRESENT' | 'ABSENT'> {
  return {
    ...statusMap,
    [studentId]: statusMap[studentId] === 'ABSENT' ? 'PRESENT' : 'ABSENT',
  }
}

export function markAllStatus(
  roster: Array<{ student_id: number }>,
  status: 'PRESENT' | 'ABSENT'
): Record<number, 'PRESENT' | 'ABSENT'> {
  const newMap: Record<number, 'PRESENT' | 'ABSENT'> = {}
  roster.forEach((s) => {
    newMap[s.student_id] = status
  })
  return newMap
}

describe('Attendance Payload Builder', () => {
  it('should build correct payload for mixed statuses', () => {
    const roster = [
      { student_id: 1, name: 'Alice', reg_no: 'S001' },
      { student_id: 2, name: 'Bob', reg_no: 'S002' },
      { student_id: 3, name: 'Charlie', reg_no: 'S003' },
    ]
    const statusMap = {
      1: 'PRESENT' as const,
      2: 'ABSENT' as const,
      3: 'PRESENT' as const,
    }

    const payload = buildAttendancePayload(roster, statusMap)

    expect(payload).toEqual([
      { student_id: 2, status: 'A' },
    ])
  })

  it('should return empty array when all present', () => {
    const roster = [
      { student_id: 1, name: 'Alice', reg_no: 'S001' },
      { student_id: 2, name: 'Bob', reg_no: 'S002' },
    ]
    const statusMap = {
      1: 'PRESENT' as const,
      2: 'PRESENT' as const,
    }

    const payload = buildAttendancePayload(roster, statusMap)

    expect(payload).toEqual([])
  })

  it('should include all students when all absent', () => {
    const roster = [
      { student_id: 1, name: 'Alice', reg_no: 'S001' },
      { student_id: 2, name: 'Bob', reg_no: 'S002' },
    ]
    const statusMap = {
      1: 'ABSENT' as const,
      2: 'ABSENT' as const,
    }

    const payload = buildAttendancePayload(roster, statusMap)

    expect(payload).toEqual([
      { student_id: 1, status: 'A' },
      { student_id: 2, status: 'A' },
    ])
  })
})

describe('Toggle Student Status', () => {
  it('should toggle from PRESENT to ABSENT', () => {
    const statusMap = {
      1: 'PRESENT' as const,
      2: 'PRESENT' as const,
    }

    const result = toggleStudentStatus(statusMap, 1)

    expect(result[1]).toBe('ABSENT')
    expect(result[2]).toBe('PRESENT')
  })

  it('should toggle from ABSENT to PRESENT', () => {
    const statusMap = {
      1: 'ABSENT' as const,
      2: 'PRESENT' as const,
    }

    const result = toggleStudentStatus(statusMap, 1)

    expect(result[1]).toBe('PRESENT')
    expect(result[2]).toBe('PRESENT')
  })

  it('should not mutate original status map', () => {
    const statusMap = {
      1: 'PRESENT' as const,
      2: 'PRESENT' as const,
    }
    const original = { ...statusMap }

    toggleStudentStatus(statusMap, 1)

    expect(statusMap).toEqual(original)
  })
})

describe('Mark All Status', () => {
  it('should mark all students as PRESENT', () => {
    const roster = [
      { student_id: 1 },
      { student_id: 2 },
      { student_id: 3 },
    ]

    const result = markAllStatus(roster, 'PRESENT')

    expect(result).toEqual({
      1: 'PRESENT',
      2: 'PRESENT',
      3: 'PRESENT',
    })
  })

  it('should mark all students as ABSENT', () => {
    const roster = [
      { student_id: 1 },
      { student_id: 2 },
    ]

    const result = markAllStatus(roster, 'ABSENT')

    expect(result).toEqual({
      1: 'ABSENT',
      2: 'ABSENT',
    })
  })

  it('should handle empty roster', () => {
    const roster: Array<{ student_id: number }> = []

    const result = markAllStatus(roster, 'PRESENT')

    expect(result).toEqual({})
  })
})
