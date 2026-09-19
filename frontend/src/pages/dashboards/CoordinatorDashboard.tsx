import { StatsDashboard, type QuickLink, type StatDefinition } from './StatsDashboard'

const STATS: StatDefinition[] = [
  { key: 'total_students', label: 'Active Students', icon: '👥' },
  { key: 'total_programs', label: 'Active Programs', icon: '🎓' },
  { key: 'total_batches', label: 'Batches', icon: '🗂️' },
  { key: 'total_groups', label: 'Groups', icon: '👪' },
  { key: 'total_sessions', label: 'Timetable Sessions', icon: '📅' },
  { key: 'total_exams', label: 'Exams', icon: '📋' },
  { key: 'published_results', label: 'Published Results', icon: '📢' },
  { key: 'draft_results', label: 'Draft Results', icon: '📝' },
]

const LINKS: QuickLink[] = [
  { label: 'Timetable', path: '/timetable', description: 'Sessions, weekly timetables and entries' },
  { label: 'Students & placement', path: '/students', description: 'Find a student to manage placement' },
  { label: 'Attendance input', path: '/attendance/input', description: 'Live, CSV and sheet attendance entry' },
  { label: 'Student import', path: '/system/students/import', description: 'Bulk import students from CSV' },
  { label: 'Faculty import', path: '/system/faculty/import', description: 'Bulk import faculty from CSV' },
  { label: 'Notifications', path: '/notifications/manage', description: 'Compose and send announcements' },
]

export const CoordinatorDashboard = () => (
  <StatsDashboard title="Coordinator Dashboard" subtitle="Placement, timetable and program overview." stats={STATS} links={LINKS} />
)
