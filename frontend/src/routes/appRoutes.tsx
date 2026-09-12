import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Spinner } from '@/components/ui/Spinner'
// LegacyRouteGuard removed - all legacy routes have been deleted

const PublicRouteFallback = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardHome = lazy(() => import('@/pages/DashboardHome').then((m) => ({ default: m.DashboardHome })))
const AdminDashboard = lazy(() => import('@/pages/dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const RegistrarDashboard = lazy(() => import('@/pages/dashboards/RegistrarDashboard').then((m) => ({ default: m.RegistrarDashboard })))
const FacultyDashboard = lazy(() => import('@/pages/dashboards/FacultyDashboard').then((m) => ({ default: m.FacultyDashboard })))
const StudentDashboard = lazy(() => import('@/pages/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard })))
const ExamCellDashboard = lazy(() => import('@/pages/dashboards/ExamCellDashboard').then((m) => ({ default: m.ExamCellDashboard })))
const DataTableDemo = lazy(() => import('@/pages/demo/DataTableDemo').then((m) => ({ default: m.DataTableDemo })))
const StyleGuidePage = lazy(() => import('@/pages/demo/StyleGuidePage').then((m) => ({ default: m.StyleGuidePage })))
const AttendanceDashboard = lazy(() => import('@/pages/attendance/AttendanceDashboard').then((m) => ({ default: m.AttendanceDashboard })))
const EligibilityReport = lazy(() => import('@/pages/attendance/EligibilityReport').then((m) => ({ default: m.EligibilityReport })))
const AttendanceInputPage = lazy(() => import('@/pages/attendance/AttendanceInputPage').then((m) => ({ default: m.AttendanceInputPage })))
const PublishResults = lazy(() => import('@/pages/examcell/PublishResults').then((m) => ({ default: m.PublishResults })))
const TranscriptVerify = lazy(() => import('@/pages/verify/TranscriptVerify').then((m) => ({ default: m.TranscriptVerify })))
const AuditLog = lazy(() => import('@/pages/admin/AuditLog').then((m) => ({ default: m.AuditLog })))
const StudentsImportPage = lazy(() => import('@/pages/admin/StudentsImportPage').then((m) => ({ default: m.StudentsImportPage })))
const StudentsPage = lazy(() => import('@/features/students/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const CoursesPage = lazy(() => import('@/features/courses/CoursesPage').then((m) => ({ default: m.CoursesPage })))
const SectionsPage = lazy(() => import('@/features/sections/SectionsPage').then((m) => ({ default: m.SectionsPage })))
// Legacy assessments removed
// Legacy enrollment removed
const BulkAttendancePage = lazy(() => import('@/features/attendance/BulkAttendancePage').then((m) => ({ default: m.BulkAttendancePage })))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })))
const StudentApplicationPage = lazy(() => import('@/pages/StudentApplicationPage').then((m) => ({ default: m.StudentApplicationPage })))
const FinanceDashboard = lazy(() => import('@/pages/finance/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })))
const FeePlansPage = lazy(() => import('@/pages/finance/FeePlansPage').then((m) => ({ default: m.FeePlansPage })))
const VoucherGenerationPage = lazy(() => import('@/pages/finance/VoucherGenerationPage').then((m) => ({ default: m.VoucherGenerationPage })))
const StudentFinancePage = lazy(() => import('@/pages/finance/StudentFinancePage').then((m) => ({ default: m.StudentFinancePage })))
const DefaultersReportPage = lazy(() => import('@/pages/finance/DefaultersReportPage').then((m) => ({ default: m.DefaultersReportPage })))
const CollectionReportPage = lazy(() => import('@/pages/finance/CollectionReportPage').then((m) => ({ default: m.CollectionReportPage })))
const AgingReportPage = lazy(() => import('@/pages/finance/AgingReportPage').then((m) => ({ default: m.AgingReportPage })))
const StudentStatementPage = lazy(() => import('@/pages/finance/StudentStatementPage').then((m) => ({ default: m.StudentStatementPage })))
const VouchersPage = lazy(() => import('@/pages/finance/VouchersPage').then((m) => ({ default: m.VouchersPage })))
const PaymentsPage = lazy(() => import('@/pages/finance/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const TimetablePage = lazy(() => import('@/features/timetable/TimetablePage').then((m) => ({ default: m.TimetablePage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })))
const RolesPage = lazy(() => import('@/pages/admin/RolesPage').then((m) => ({ default: m.RolesPage })))
const SyllabusManagerPage = lazy(() => import('@/pages/admin/SyllabusManagerPage').then((m) => ({ default: m.SyllabusManagerPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })))
// ProgramsPage removed - using ProgramsListPage instead
const ProgramsListPage = lazy(() => import('@/pages/academics/ProgramsListPage').then((m) => ({ default: m.ProgramsListPage })))
const ProgramDetailPage = lazy(() => import('@/pages/academics/ProgramDetailPage').then((m) => ({ default: m.ProgramDetailPage })))
const ProgramFormPage = lazy(() => import('@/pages/academics/ProgramFormPage').then((m) => ({ default: m.ProgramFormPage })))
const BatchesPage = lazy(() => import('@/pages/academics/BatchesPage').then((m) => ({ default: m.BatchesPage })))
const AcademicPeriodsPage = lazy(() => import('@/pages/academics/AcademicPeriodsPage').then((m) => ({ default: m.AcademicPeriodsPage })))
const GroupsPage = lazy(() => import('@/pages/academics/GroupsPage').then((m) => ({ default: m.GroupsPage })))
const DepartmentsPage = lazy(() => import('@/pages/academics/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })))
const ExamsPage = lazy(() => import('@/pages/exams/ExamsPage').then((m) => ({ default: m.ExamsPage })))
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage').then((m) => ({ default: m.ResultsPage })))
// Legacy requests removed
const TranscriptsPage = lazy(() => import('@/pages/transcripts/TranscriptsPage').then((m) => ({ default: m.TranscriptsPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
// UnauthorizedPage is imported dynamically in ProtectedRoute to avoid circular dependencies

/**
 * Application routes configuration
 * Public routes: /login
 * Protected routes: /dashboard and role-specific dashboards
 *
 * Every route component below is lazy-loaded (see the `lazy(...)` imports
 * above) so the initial bundle only ships the app shell; ProtectedRoute
 * wraps its children in a single shared <Suspense> boundary, so the
 * loading fallback is defined once rather than at every route.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PublicRouteFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/apply',
    element: (
      <Suspense fallback={<PublicRouteFallback />}>
        <StudentApplicationPage />
      </Suspense>
    ),
  },
  {
    // Layout route: renders the shared sidebar/topbar/breadcrumbs chrome once
    // and mounts the active dashboard page into its <Outlet/>, instead of
    // every page below wrapping itself in <DashboardLayout>.
    element: <DashboardLayout />,
    children: [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardHome />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/registrar',
    element: (
      <ProtectedRoute allowedRoles={['Registrar']}>
        <RegistrarDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/faculty',
    element: (
      <ProtectedRoute allowedRoles={['Faculty']}>
        <FacultyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/student',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/examcell',
    element: (
      <ProtectedRoute allowedRoles={['ExamCell']}>
        <ExamCellDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/demo/datatable',
    element: (
      <ProtectedRoute>
        <DataTableDemo />
      </ProtectedRoute>
    ),
  },
  {
    path: '/demo/style-guide',
    element: (
      <ProtectedRoute>
        <StyleGuidePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/attendance',
    element: (
      <ProtectedRoute allowedRoles={['Faculty', 'Admin']}>
        <AttendanceDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/attendance/input',
    element: (
      <ProtectedRoute allowedRoles={['Faculty', 'Admin']}>
        <AttendanceInputPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/attendance/eligibility',
    element: (
      <ProtectedRoute allowedRoles={['Registrar', 'Admin']}>
        <EligibilityReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gradebook',
    // Legacy assessments were removed. Preserve deep links while directing users
    // to the canonical exams/results workflow.
    element: <Navigate to="/results" replace />,
  },
  {
    path: '/examcell/publish',
    element: (
      <ProtectedRoute allowedRoles={['ExamCell', 'Admin']}>
        <PublishResults />
      </ProtectedRoute>
    ),
  },
  {
    path: '/verify/:token',
    element: (
      <Suspense fallback={<PublicRouteFallback />}>
        <TranscriptVerify />
      </Suspense>
    ),
  },
  {
    path: '/system/audit',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AuditLog />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/students/import',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Coordinator']}>
        <StudentsImportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']}>
        <StudentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/courses',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Faculty']}>
        <CoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sections',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Faculty']}>
        <SectionsPage />
      </ProtectedRoute>
    ),
  },
  // Legacy assessments route removed
  {
    path: '/timetable',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Faculty', 'Registrar', 'Coordinator', 'Student']}>
        <TimetablePage />
      </ProtectedRoute>
    ),
  },
  // Legacy enrollment route removed
  {
    path: '/attendance/bulk',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Faculty']}>
        <BulkAttendancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AnalyticsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <FinanceDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/fee-plans',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <FeePlansPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/vouchers',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <VoucherGenerationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/vouchers/list',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <VouchersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/payments',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <PaymentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/me',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <StudentFinancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/reports/defaulters',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <DefaultersReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/reports/collection',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <CollectionReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/reports/aging',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance']}>
        <AgingReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/finance/reports/statement',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Finance', 'Student']}>
        <StudentStatementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/syllabus',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/system/syllabus">
        <SyllabusManagerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/settings',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/system/settings">
        <AdminSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/users',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/system/users">
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/roles',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/system/roles">
        <RolesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/programs',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Coordinator']}>
        <ProgramsListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/programs/new',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Coordinator']}>
        <ProgramFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/programs/:id',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Coordinator']}>
        <ProgramDetailPage />
      </ProtectedRoute>
    ),
  },
  // Legacy programs-legacy route removed
  {
    path: '/academics/batches',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']} path="/academics/batches">
        <BatchesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/periods',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']} path="/academics/periods">
        <AcademicPeriodsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/groups',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']} path="/academics/groups">
        <GroupsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/academics/departments',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']} path="/academics/departments">
        <DepartmentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Faculty', 'ExamCell']} path="/exams">
        <ExamsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/results',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Faculty', 'Student', 'ExamCell']} path="/results">
        <ResultsPage />
      </ProtectedRoute>
    ),
  },
  // Legacy requests route removed
  {
    path: '/transcripts',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Student', 'ExamCell']} path="/transcripts">
        <TranscriptsPage />
      </ProtectedRoute>
    ),
  },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
