/**
 * Tests for Attendance API Service
 * Verifies session-based attendance endpoints are called correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { attendanceService } from './attendance'
import api from '@/api/axios'

// Mock the api module
vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('attendanceService (Session-Based)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBySessionId', () => {
    it('should use /api/attendance/ endpoint with session query parameter', async () => {
      const mockResponse = {
        data: {
          count: 2,
          results: [
            {
              id: 1,
              session: 123,
              student: 456,
              status: 'PRESENT',
              marked_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 2,
              session: 123,
              student: 457,
              status: 'ABSENT',
              marked_at: '2024-01-15T10:00:00Z',
            },
          ],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await attendanceService.getBySessionId(123, { date: '2024-01-15' })

      // Should use /api/attendance/ with session query parameter (not section)
      expect(api.get).toHaveBeenCalledWith('/api/attendance/', {
        params: {
          session: 123,
          date: '2024-01-15',
        },
      })
    })
  })

  describe('markAttendance (Session-Based)', () => {
    it('should call session-based mark endpoint with correct payload', async () => {
      const sessionId = 123
      const attendanceData = {
        date: '2024-01-15',
        attendance: [
          { student_id: 1, status: 'PRESENT' as const },
          { student_id: 2, status: 'ABSENT' as const },
          { student_id: 3, status: 'LATE' as const },
        ],
      }

      const mockResponse = {
        data: {
          created: 2,
          updated: 1,
          total: 3,
        },
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await attendanceService.markAttendance(sessionId, attendanceData)

      // Should call POST /api/attendance/sessions/{id}/mark (session-based endpoint)
      expect(api.post).toHaveBeenCalledWith(
        `/api/attendance/sessions/${sessionId}/mark`,
        attendanceData
      )

      expect(result).toEqual({
        created: 2,
        updated: 1,
        total: 3,
      })
    })

    it('should accept valid status values', async () => {
      const sessionId = 123
      const attendanceData = {
        date: '2024-01-15',
        attendance: [
          { student_id: 1, status: 'PRESENT' as const },
          { student_id: 2, status: 'ABSENT' as const },
          { student_id: 3, status: 'LATE' as const },
          { student_id: 4, status: 'LEAVE' as const },
        ],
      }

      vi.mocked(api.post).mockResolvedValue({
        data: { created: 4, updated: 0, total: 4 },
      })

      await attendanceService.markAttendance(sessionId, attendanceData)

      expect(api.post).toHaveBeenCalledWith(
        `/api/attendance/sessions/${sessionId}/mark`,
        attendanceData
      )
    })
  })

  describe('getSummary', () => {
    it('should fetch attendance summary with session filter', async () => {
      const mockResponse = {
        data: {
          total: 10,
          present: 8,
          absent: 2,
          late: 0,
          leave: 0,
          percentage: 80.0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await attendanceService.getSummary({ session: 123 })

      expect(api.get).toHaveBeenCalledWith('/api/attendance/summary/', {
        params: { session: 123 },
      })

      expect(result).toEqual({
        total: 10,
        present: 8,
        absent: 2,
        late: 0,
        leave: 0,
        percentage: 80.0,
      })
    })

    it('should fetch attendance summary with student filter', async () => {
      const mockResponse = {
        data: {
          total: 5,
          present: 4,
          absent: 1,
          late: 0,
          leave: 0,
          percentage: 80.0,
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await attendanceService.getSummary({ student: 456 })

      expect(api.get).toHaveBeenCalledWith('/api/attendance/summary/', {
        params: { student: 456 },
      })

      expect(result.percentage).toBe(80.0)
    })
  })

  describe('getAll', () => {
    it('should fetch attendance with filters', async () => {
      const mockResponse = {
        data: {
          count: 1,
          results: [
            {
              id: 1,
              session: 123,
              student: 456,
              status: 'PRESENT',
              marked_at: '2024-01-15T10:00:00Z',
            },
          ],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await attendanceService.getAll({
        session: 123,
        student: 456,
        date: '2024-01-15',
      })

      expect(api.get).toHaveBeenCalledWith('/api/attendance/', {
        params: {
          session: 123,
          student: 456,
          date: '2024-01-15',
        },
      })
    })
  })
})
