import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'

export const StudentDashboard = () => {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.full_name || 'Student'}. Here's your academic overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current GPA</p>
                <p className="text-2xl font-bold text-gray-900">3.75</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                🎯
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Credits Earned</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">92%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </Card>
        </div>

        {/* Current Courses */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Semester Courses
          </h2>
          <div className="space-y-3">
            {[
              { code: 'CS301', name: 'Algorithms', instructor: 'Dr. Smith', grade: 'A' },
              { code: 'MATH201', name: 'Linear Algebra', instructor: 'Prof. Johnson', grade: 'A-' },
              { code: 'PHY101', name: 'Physics I', instructor: 'Dr. Williams', grade: 'B+' },
            ].map((course, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.code} - {course.name}</p>
                  <p className="text-xs text-gray-500">{course.instructor}</p>
                </div>
                <Badge variant="primary">{course.grade}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Exams
          </h2>
          <div className="space-y-3">
            {[
              { course: 'CS301', type: 'Midterm Exam', date: 'Mar 15, 2024' },
              { course: 'MATH201', type: 'Quiz 3', date: 'Mar 18, 2024' },
              { course: 'PHY101', type: 'Lab Report', date: 'Mar 20, 2024' },
            ].map((exam, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exam.course} - {exam.type}</p>
                  <p className="text-xs text-gray-500">{exam.date}</p>
                </div>
                <Badge variant="warning">Upcoming</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
