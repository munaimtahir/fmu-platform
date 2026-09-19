import { StatsDashboard, type QuickLink, type StatDefinition } from './StatsDashboard'

const STATS: StatDefinition[] = [
  { key: 'active_students', label: 'Active Students', icon: '👥' },
  { key: 'students_on_leave', label: 'Students on Leave', icon: '🏖️' },
  { key: 'pending_compliance_reviews', label: 'Compliance Awaiting Review', icon: '📎' },
  { key: 'pending_result_corrections', label: 'Pending Result Corrections', icon: '✏️' },
  { key: 'total_programs', label: 'Active Programs', icon: '🎓' },
  { key: 'total_batches', label: 'Batches', icon: '🗂️' },
]

const LINKS: QuickLink[] = [
  { label: 'Students', path: '/students', description: 'Search and manage student records' },
  { label: 'People', path: '/people', description: 'Person master records and documents' },
  { label: 'Compliance review', path: '/compliance', description: 'Verify or reject submitted requirements' },
  { label: 'Result corrections', path: '/results/corrections', description: 'Review correction requests' },
  { label: 'Academic periods', path: '/academics/periods', description: 'Open and close academic periods' },
  { label: 'Eligibility report', path: '/attendance/eligibility', description: 'Attendance eligibility by section' },
  { label: 'Notifications', path: '/notifications/manage', description: 'Compose and send announcements' },
]

export const RegistrarDashboard = () => (
  <StatsDashboard title="Registrar Dashboard" subtitle="Manage student records, compliance and academic periods." stats={STATS} links={LINKS} />
)
