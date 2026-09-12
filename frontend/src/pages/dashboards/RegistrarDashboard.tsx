import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/useAuth'

export const RegistrarDashboard = () => {
  const { user } = useAuth()

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-ink-primary mb-2">
            Registrar Dashboard
          </h1>
          <p className="text-ink-secondary">
            Welcome, {user?.full_name || 'Registrar'}. Manage student records and enrollments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Pending Registrations</p>
                <p className="text-h2 text-ink-primary">24</p>
              </div>
              <div className="w-12 h-12 bg-warning-subtle rounded-lg flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Active Students</p>
                <p className="text-h2 text-ink-primary">1,189</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Course Enrollments</p>
                <p className="text-h2 text-ink-primary">3,456</p>
              </div>
              <div className="w-12 h-12 bg-success-subtle rounded-lg flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary mb-1">Records Updated</p>
                <p className="text-h2 text-ink-primary">89</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-h3 text-ink-primary mb-4">
            Recent Student Registrations
          </h2>
          <div className="space-y-3">
            {[
              { id: 'S2024001', name: 'Alice Johnson', program: 'Computer Science', status: 'pending' },
              { id: 'S2024002', name: 'Bob Williams', program: 'Engineering', status: 'approved' },
              { id: 'S2024003', name: 'Carol Davis', program: 'Mathematics', status: 'pending' },
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-neutral-subtle last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-primary">{student.name}</p>
                  <p className="text-xs text-ink-muted">{student.id} • {student.program}</p>
                </div>
                <StatusBadge domain="student" status={student.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    
  )
}
