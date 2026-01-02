/**
 * Transcripts API service
 */
import api from '@/api/axios'

export interface TranscriptJob {
  student_id: number
  email?: string
}

export const transcriptsService = {
  /**
   * Generate transcript for a student (downloads PDF)
   */
  async generate(studentId: number): Promise<Blob> {
    const response = await api.get(`/api/transcripts/${studentId}/`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Enqueue transcript generation as background job
   */
  async enqueue(data: TranscriptJob): Promise<void> {
    await api.post('/api/transcripts/enqueue/', data)
  },

  /**
   * Verify transcript token
   */
  async verify(token: string): Promise<any> {
    const response = await api.get(`/api/transcripts/verify/${token}/`)
    return response.data
  },
}
