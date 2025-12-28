import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/api/axios'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

interface TranscriptData {
  student: {
    reg_no: string
    full_name: string
    program: string
  }
  issue_date: string
  courses: Array<{
    course_code: string
    course_title: string
    grade: string
    credits: number
  }>
  cgpa: number
  total_credits: number
}

export function TranscriptVerify() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<TranscriptData | null>(null)
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
        const response = await api.get(`/api/transcripts/verify/${token}/`)
        setData(response.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Transcript not found or verification token expired')
        } else {
          setError('Failed to verify transcript')
        }
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    verifyTranscript()
  }, [token])

  const handlePrint = () => {
    window.print()
  }

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

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Action Buttons (hidden when printing) */}
        <div className="mb-6 print:hidden">
          <Button onClick={handlePrint}>Print Transcript</Button>
        </div>

        {/* Transcript Card */}
        <Card className="print:shadow-none">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Academic Transcript
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                This is an official transcript verified via QR code
              </p>
            </div>

            {/* Student Information */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-4">
                Student Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Registration Number:
                  </span>
                  <p className="font-medium">{data.student.reg_no}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <p className="font-medium">{data.student.full_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Program:</span>
                  <p className="font-medium">{data.student.program}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Issue Date:</span>
                  <p className="font-medium">
                    {new Date(data.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Academic Performance
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-2">Course Code</th>
                    <th className="text-left py-2 px-2">Course Title</th>
                    <th className="text-center py-2 px-2">Credits</th>
                    <th className="text-center py-2 px-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((course, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 px-2">{course.course_code}</td>
                      <td className="py-2 px-2">{course.course_title}</td>
                      <td className="text-center py-2 px-2">
                        {course.credits}
                      </td>
                      <td className="text-center py-2 px-2 font-medium">
                        {course.grade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm text-gray-600">Total Credits:</span>
                  <p className="text-2xl font-bold">{data.total_credits}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Cumulative GPA:
                  </span>
                  <p className="text-2xl font-bold">{data.cgpa.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="border-t pt-6 text-center">
              <p className="text-xs text-gray-500">
                This transcript has been verified using the QR code verification
                system.
                <br />
                Verification Token: {token}
                <br />
                For verification queries, contact the Office of the Registrar.
              </p>
            </div>

            {/* Print-only Footer */}
            <div className="hidden print:block border-t pt-6">
              <p className="text-xs text-gray-500 text-center">
                Printed on {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
