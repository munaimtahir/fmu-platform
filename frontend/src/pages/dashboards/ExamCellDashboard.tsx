import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'

export const ExamCellDashboard = () => {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Cell Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {user?.full_name || 'Exam Coordinator'}. Manage examinations and results.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Scheduled Exams</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Results</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published Results</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Re-evaluation Requests</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-2xl">
                🔄
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Exams */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Examinations
          </h2>
          <div className="space-y-3">
            {[
              { code: 'CS301', name: 'Algorithms Midterm', date: 'Mar 15, 2024', students: 85 },
              { code: 'MATH201', name: 'Linear Algebra Final', date: 'Mar 22, 2024', students: 102 },
              { code: 'PHY101', name: 'Physics I Quiz', date: 'Mar 18, 2024', students: 95 },
            ].map((exam, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exam.code} - {exam.name}</p>
                  <p className="text-xs text-gray-500">{exam.date} • {exam.students} students</p>
                </div>
                <Badge variant="primary">Scheduled</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Result Processing */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Results Awaiting Publication
          </h2>
          <div className="space-y-3">
            {[
              { course: 'CS201', type: 'Midterm', submitted: '5/5', status: 'ready' },
              { course: 'ENG101', type: 'Final', submitted: '3/4', status: 'pending' },
              { course: 'BIO201', type: 'Quiz', submitted: '2/2', status: 'ready' },
            ].map((result, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{result.course} - {result.type}</p>
                  <p className="text-xs text-gray-500">Grades submitted: {result.submitted}</p>
                </div>
                <Badge variant={result.status === 'ready' ? 'success' : 'warning'}>
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
