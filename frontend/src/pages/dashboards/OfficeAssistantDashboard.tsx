import { StatsDashboard, type QuickLink, type StatDefinition } from './StatsDashboard'

const STATS: StatDefinition[] = [
  { key: 'total_sessions', label: 'Timetable Sessions', icon: '📅' },
  { key: 'draft_results', label: 'Draft Results', icon: '📝' },
  { key: 'total_exams', label: 'Unpublished Exams', icon: '📋' },
]

const LINKS: QuickLink[] = [
  { label: 'Attendance input', path: '/attendance/input', description: 'Live, CSV and sheet attendance entry' },
  { label: 'Timetable', path: '/timetable', description: 'View sessions and entries' },
  { label: 'Gradebook', path: '/gradebook', description: 'Enter draft component marks' },
  { label: 'Exams', path: '/exams', description: 'Exam schedule' },
]

export const OfficeAssistantDashboard = () => (
  <StatsDashboard title="Office Assistant Dashboard" subtitle="Data-entry overview." stats={STATS} links={LINKS} />
)
