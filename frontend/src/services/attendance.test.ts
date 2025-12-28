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

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBySectionId', () => {
    it('should use /api/attendance/ endpoint with section query parameter', async () => {
      const mockResponse = {
        data: {
          count: 1,
          results: [
            {
              id: 1,
              section: 123,
              student: 456,
              date: '2024-01-15',
              present: true,
            },
          ],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await attendanceService.getBySectionId(123, { date: '2024-01-15' })

      // Should NOT use /api/sections/123/attendance/ (doesn't exist in backend)
      // Should use /api/attendance/ with section query parameter
      expect(api.get).toHaveBeenCalledWith('/api/attendance/', {
        params: {
          section: 123,
          date: '2024-01-15',
        },
      })
    })
  })

  describe('markAttendance', () => {
    it('should create individual attendance records via /api/attendance/', async () => {
      const sectionId = 123
      const attendanceData = {
        date: '2024-01-15',
        records: [
          { student: 1, status: 'Present' as const },
          { student: 2, status: 'Absent' as const },
          { student: 3, status: 'Late' as const },
        ],
      }

      const mockAttendance = {
        id: 1,
        section: sectionId,
        student: 1,
        date: '2024-01-15',
        present: true,
        status: 'Present',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockAttendance })

      await attendanceService.markAttendance(sectionId, attendanceData)

      // Should call POST /api/attendance/ three times (once per student)
      // NOT /api/sections/123/attendance/ (doesn't exist in backend)
      expect(api.post).toHaveBeenCalledTimes(3)

      expect(api.post).toHaveBeenNthCalledWith(1, '/api/attendance/', {
        section: sectionId,
        student: 1,
        date: '2024-01-15',
        present: true,
        status: 'Present',
      })

      expect(api.post).toHaveBeenNthCalledWith(2, '/api/attendance/', {
        section: sectionId,
        student: 2,
        date: '2024-01-15',
        present: false,
        status: 'Absent',
      })

      expect(api.post).toHaveBeenNthCalledWith(3, '/api/attendance/', {
        section: sectionId,
        student: 3,
        date: '2024-01-15',
        present: false,
        status: 'Late',
      })
    })

    it('should set present=true only for Present status', async () => {
      const sectionId = 123
      const attendanceData = {
        date: '2024-01-15',
        records: [
          { student: 1, status: 'Present' as const },
          { student: 2, status: 'Excused' as const },
        ],
      }

      vi.mocked(api.post).mockResolvedValue({ data: {} })

      await attendanceService.markAttendance(sectionId, attendanceData)

      // Present status should have present=true
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        '/api/attendance/',
        expect.objectContaining({ present: true, status: 'Present' })
      )

      // Excused status should have present=false
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        '/api/attendance/',
        expect.objectContaining({ present: false, status: 'Excused' })
      )
    })
  })
})
