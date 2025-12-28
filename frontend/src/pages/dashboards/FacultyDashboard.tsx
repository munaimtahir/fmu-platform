import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/useAuth'

export const FacultyDashboard = () => {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Faculty Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {user?.full_name || 'Professor'}. Manage your courses and students.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Courses</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Grades</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Classes</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
          </Card>
        </div>

        {/* My Courses */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Courses
          </h2>
          <div className="space-y-3">
            {[
              { code: 'CS101', name: 'Introduction to Programming', students: 45, section: 'A' },
              { code: 'CS201', name: 'Data Structures', students: 38, section: 'B' },
              { code: 'CS301', name: 'Algorithms', students: 32, section: 'A' },
            ].map((course, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.code} - {course.name}</p>
                  <p className="text-xs text-gray-500">Section {course.section} • {course.students} students</p>
                </div>
                <button className="px-3 py-1 text-sm text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors duration-150">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
