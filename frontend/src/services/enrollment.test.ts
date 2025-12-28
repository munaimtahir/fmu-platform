import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enrollmentService } from './enrollment'
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

describe('enrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enrollStudent', () => {
    it('should send student_id (singular) not student_ids (plural)', async () => {
      const mockEnrollment = {
        id: 1,
        student: 123,
        section: 456,
        term: 1,
        status: 'active',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockEnrollment })

      await enrollmentService.enrollStudent(456, 123)

      // Verify the API was called with correct endpoint and payload
      expect(api.post).toHaveBeenCalledWith('/api/sections/456/enroll/', {
        student_id: 123, // Should be student_id (singular), not student_ids
      })
    })
  })

  describe('enrollStudentsBulk', () => {
    it('should call enrollStudent for each student individually', async () => {
      const studentIds = [1, 2, 3]
      const sectionId = 456

      const mockEnrollment = {
        id: 1,
        student: 1,
        section: sectionId,
        term: 1,
        status: 'active',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockEnrollment })

      const result = await enrollmentService.enrollStudentsBulk(sectionId, studentIds)

      // Should call post 3 times, once for each student
      expect(api.post).toHaveBeenCalledTimes(3)

      // Each call should use student_id (singular)
      expect(api.post).toHaveBeenNthCalledWith(1, '/api/sections/456/enroll/', {
        student_id: 1,
      })
      expect(api.post).toHaveBeenNthCalledWith(2, '/api/sections/456/enroll/', {
        student_id: 2,
      })
      expect(api.post).toHaveBeenNthCalledWith(3, '/api/sections/456/enroll/', {
        student_id: 3,
      })

      expect(result.successful).toHaveLength(3)
      expect(result.failed).toHaveLength(0)
    })

    it('should handle partial failures gracefully', async () => {
      const studentIds = [1, 2, 3]
      const sectionId = 456

      const mockEnrollment = {
        id: 1,
        student: 1,
        section: sectionId,
        term: 1,
        status: 'active',
      }

      // First and third succeed, second fails
      vi.mocked(api.post)
        .mockResolvedValueOnce({ data: mockEnrollment })
        .mockRejectedValueOnce({
          response: { data: { error: { message: 'Already enrolled' } } },
        })
        .mockResolvedValueOnce({ data: { ...mockEnrollment, student: 3 } })

      const result = await enrollmentService.enrollStudentsBulk(sectionId, studentIds)

      expect(result.successful).toHaveLength(2)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]).toEqual({
        studentId: 2,
        error: 'Already enrolled',
      })
    })
  })
})
