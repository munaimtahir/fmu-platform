import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/useAuth'

export const ExamCellDashboard = () => {
  const { user } = useAuth()

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-ink-primary mb-2">
            Exam Cell Dashboard
          </h1>
          <p className="text-ink-secondary">
            Welcome, {user?.full_name || 'Exam Coordinator'}. Manage examinations and results.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Scheduled Exams</p>
                <p className="text-h2 text-ink-primary">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Pending Results</p>
                <p className="text-h2 text-ink-primary">8</p>
              </div>
              <div className="w-12 h-12 bg-warning-subtle rounded-lg flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Published Results</p>
                <p className="text-h2 text-ink-primary">45</p>
              </div>
              <div className="w-12 h-12 bg-success-subtle rounded-lg flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Re-evaluation Requests</p>
                <p className="text-h2 text-ink-primary">6</p>
              </div>
              <div className="w-12 h-12 bg-danger-subtle rounded-lg flex items-center justify-center text-2xl">
                🔄
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Exams */}
        <Card>
          <h2 className="text-h3 text-ink-primary mb-4">
            Upcoming Examinations
          </h2>
          <div className="space-y-3">
            {[
              { code: 'CS301', name: 'Algorithms Midterm', date: 'Mar 15, 2024', students: 85 },
              { code: 'MATH201', name: 'Linear Algebra Final', date: 'Mar 22, 2024', students: 102 },
              { code: 'PHY101', name: 'Physics I Quiz', date: 'Mar 18, 2024', students: 95 },
            ].map((exam, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-neutral-subtle last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-primary">{exam.code} - {exam.name}</p>
                  <p className="text-xs text-ink-muted">{exam.date} • {exam.students} students</p>
                </div>
                <StatusBadge domain="timetable" status="scheduled" label="Scheduled" />
              </div>
            ))}
          </div>
        </Card>

        {/* Result Processing */}
        <Card>
          <h2 className="text-h3 text-ink-primary mb-4">
            Results Awaiting Publication
          </h2>
          <div className="space-y-3">
            {[
              { course: 'CS201', type: 'Midterm', submitted: '5/5', status: 'ready' },
              { course: 'ENG101', type: 'Final', submitted: '3/4', status: 'pending' },
              { course: 'BIO201', type: 'Quiz', submitted: '2/2', status: 'ready' },
            ].map((result, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-neutral-subtle last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-primary">{result.course} - {result.type}</p>
                  <p className="text-xs text-ink-muted">Grades submitted: {result.submitted}</p>
                </div>
                <StatusBadge domain="results" status={result.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    
  )
}
