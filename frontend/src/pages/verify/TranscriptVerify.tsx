import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { transcriptsService, type TranscriptVerification } from '@/services/transcripts'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

export function TranscriptVerify() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<TranscriptVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyTranscript = async () => {
      if (!token) {
        setError('Invalid verification token')
        setLoading(false)
        return
      }

      try {
        const result = await transcriptsService.verify(token)
        setData(result)
      } catch {
        setError('Failed to verify transcript')
      } finally {
        setLoading(false)
      }
    }

    verifyTranscript()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <div className="p-6">
            <Alert variant="error">{error}</Alert>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        <Card>
          <div className="p-8 space-y-6">
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900">Transcript Verification</h1>
              <p className="text-sm text-gray-600 mt-2">
                Verification checks the authenticity token printed on a generated transcript.
              </p>
            </div>

            {data?.valid ? (
              <Alert variant="success">Transcript token is valid.</Alert>
            ) : (
              <Alert variant="error">{data?.reason || 'Transcript token is invalid.'}</Alert>
            )}

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">Status</dt>
                <dd className="font-medium">{data?.valid ? 'Valid' : 'Invalid'}</dd>
              </div>
              {data?.student_id && (
                <div>
                  <dt className="text-gray-600">Student ID</dt>
                  <dd className="font-medium">{data.student_id}</dd>
                </div>
              )}
              <div className="md:col-span-2">
                <dt className="text-gray-600">Reason</dt>
                <dd className="font-medium">{data?.reason}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-gray-600">Verification Token</dt>
                <dd className="font-mono text-xs break-all">{token}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </div>
  )
}
