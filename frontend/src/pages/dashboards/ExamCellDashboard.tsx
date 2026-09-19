import { StatsDashboard, type QuickLink, type StatDefinition } from './StatsDashboard'

const STATS: StatDefinition[] = [
  { key: 'total_exams', label: 'Exams', icon: '📅' },
  { key: 'unpublished_exams', label: 'Unpublished Exams', icon: '🕒' },
  { key: 'draft_results', label: 'Draft Results', icon: '📝' },
  { key: 'verified_results', label: 'Verified, Awaiting Publication', icon: '✅' },
  { key: 'published_results', label: 'Published Results', icon: '📢' },
  { key: 'frozen_results', label: 'Frozen Results', icon: '🔒' },
  { key: 'pending_result_corrections', label: 'Pending Corrections', icon: '✏️' },
]

const LINKS: QuickLink[] = [
  { label: 'Exams', path: '/exams', description: 'Schedule exams and manage components' },
  { label: 'Results', path: '/results', description: 'Browse and inspect results' },
  { label: 'Verify & publish results', path: '/examcell/publish', description: 'Verify, publish or freeze results' },
  { label: 'Result corrections', path: '/results/corrections', description: 'Review and apply correction requests' },
  { label: 'Gradebook', path: '/gradebook', description: 'Component marks by section' },
  { label: 'Transcripts', path: '/transcripts', description: 'Generate transcripts (when assigned)' },
]

export const ExamCellDashboard = () => (
  <StatsDashboard title="Exam Cell Dashboard" subtitle="Manage examinations, results and corrections." stats={STATS} links={LINKS} />
)
