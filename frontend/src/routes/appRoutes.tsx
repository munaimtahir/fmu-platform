import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Spinner } from '@/components/ui/Spinner'

const PublicRouteFallback = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const MandatoryPasswordChangePage = lazy(() => import('@/features/auth/MandatoryPasswordChangePage').then((m) => ({ default: m.MandatoryPasswordChangePage })))
const StudentOnboardingPage = lazy(() => import('@/pages/students/StudentOnboardingPage').then((m) => ({ default: m.StudentOnboardingPage })))
const TranscriptVerify = lazy(() => import('@/pages/verify/TranscriptVerify').then((m) => ({ default: m.TranscriptVerify })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const DashboardHome = lazy(() => import('@/pages/DashboardHome').then((m) => ({ default: m.DashboardHome })))
const AdminDashboard = lazy(() => import('@/pages/dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const RegistrarDashboard = lazy(() => import('@/pages/dashboards/RegistrarDashboard').then((m) => ({ default: m.RegistrarDashboard })))
const FacultyDashboard = lazy(() => import('@/pages/dashboards/FacultyDashboard').then((m) => ({ default: m.FacultyDashboard })))
const StudentDashboard = lazy(() => import('@/pages/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard })))
const ExamCellDashboard = lazy(() => import('@/pages/dashboards/ExamCellDashboard').then((m) => ({ default: m.ExamCellDashboard })))
const CoordinatorDashboard = lazy(() => import('@/pages/dashboards/CoordinatorDashboard').then((m) => ({ default: m.CoordinatorDashboard })))
const OfficeAssistantDashboard = lazy(() => import('@/pages/dashboards/OfficeAssistantDashboard').then((m) => ({ default: m.OfficeAssistantDashboard })))
const DataTableDemo = lazy(() => import('@/pages/demo/DataTableDemo').then((m) => ({ default: m.DataTableDemo })))
const StyleGuidePage = lazy(() => import('@/pages/demo/StyleGuidePage').then((m) => ({ default: m.StyleGuidePage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const NotificationAdminPage = lazy(() => import('@/pages/admin/NotificationAdminPage').then((m) => ({ default: m.NotificationAdminPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AnalyticsDashboard = lazy(() => import('@/features/analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })))
const PeopleListPage = lazy(() => import('@/pages/people/PeopleListPage').then((m) => ({ default: m.PeopleListPage })))
const PersonDetailPage = lazy(() => import('@/pages/people/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage })))
const StudentsPage = lazy(() => import('@/features/students/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const StudentDetailPage = lazy(() => import('@/pages/students/StudentDetailPage').then((m) => ({ default: m.StudentDetailPage })))
const ComplianceAdminPage = lazy(() => import('@/pages/compliance/ComplianceAdminPage').then((m) => ({ default: m.ComplianceAdminPage })))
const MyCompliancePage = lazy(() => import('@/pages/compliance/MyCompliancePage').then((m) => ({ default: m.MyCompliancePage })))
const CoursesPage = lazy(() => import('@/features/courses/CoursesPage').then((m) => ({ default: m.CoursesPage })))
const SectionsPage = lazy(() => import('@/features/sections/SectionsPage').then((m) => ({ default: m.SectionsPage })))
const SectionDetailPage = lazy(() => import('@/features/sections/SectionDetailPage').then((m) => ({ default: m.SectionDetailPage })))
const ProgramsListPage = lazy(() => import('@/pages/academics/ProgramsListPage').then((m) => ({ default: m.ProgramsListPage })))
const ProgramFormPage = lazy(() => import('@/pages/academics/ProgramFormPage').then((m) => ({ default: m.ProgramFormPage })))
const ProgramDetailPage = lazy(() => import('@/pages/academics/ProgramDetailPage').then((m) => ({ default: m.ProgramDetailPage })))
const BatchesPage = lazy(() => import('@/pages/academics/BatchesPage').then((m) => ({ default: m.BatchesPage })))
const AcademicPeriodsPage = lazy(() => import('@/pages/academics/AcademicPeriodsPage').then((m) => ({ default: m.AcademicPeriodsPage })))
const GroupsPage = lazy(() => import('@/pages/academics/GroupsPage').then((m) => ({ default: m.GroupsPage })))
const DepartmentsPage = lazy(() => import('@/pages/academics/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })))
const TimetablePage = lazy(() => import('@/features/timetable/TimetablePage').then((m) => ({ default: m.TimetablePage })))
const AttendanceDashboard = lazy(() => import('@/pages/attendance/AttendanceDashboard').then((m) => ({ default: m.AttendanceDashboard })))
const AttendanceInputPage = lazy(() => import('@/pages/attendance/AttendanceInputPage').then((m) => ({ default: m.AttendanceInputPage })))
const BulkAttendancePage = lazy(() => import('@/features/attendance/BulkAttendancePage').then((m) => ({ default: m.BulkAttendancePage })))
const EligibilityReport = lazy(() => import('@/pages/attendance/EligibilityReport').then((m) => ({ default: m.EligibilityReport })))
const LearningFeedPage = lazy(() => import('@/pages/learning/LearningFeedPage').then((m) => ({ default: m.LearningFeedPage })))
const LearningMaterialsPage = lazy(() => import('@/pages/learning/LearningMaterialsPage').then((m) => ({ default: m.LearningMaterialsPage })))
const ExamsPage = lazy(() => import('@/pages/exams/ExamsPage').then((m) => ({ default: m.ExamsPage })))
const GradebookPage = lazy(() => import('@/pages/results/GradebookPage').then((m) => ({ default: m.GradebookPage })))
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage').then((m) => ({ default: m.ResultsPage })))
const ResultCorrectionsPage = lazy(() => import('@/pages/results/ResultCorrectionsPage').then((m) => ({ default: m.ResultCorrectionsPage })))
const ResultDetailPage = lazy(() => import('@/pages/results/ResultDetailPage').then((m) => ({ default: m.ResultDetailPage })))
const PublishResults = lazy(() => import('@/pages/examcell/PublishResults').then((m) => ({ default: m.PublishResults })))
const TranscriptsPage = lazy(() => import('@/pages/transcripts/TranscriptsPage').then((m) => ({ default: m.TranscriptsPage })))
const FinanceDashboard = lazy(() => import('@/pages/finance/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })))
const FeeTypesPage = lazy(() => import('@/pages/finance/FeeTypesPage').then((m) => ({ default: m.FeeTypesPage })))
const FeePlansPage = lazy(() => import('@/pages/finance/FeePlansPage').then((m) => ({ default: m.FeePlansPage })))
const VoucherGenerationPage = lazy(() => import('@/pages/finance/VoucherGenerationPage').then((m) => ({ default: m.VoucherGenerationPage })))
const VouchersPage = lazy(() => import('@/pages/finance/VouchersPage').then((m) => ({ default: m.VouchersPage })))
const VoucherDetailPage = lazy(() => import('@/pages/finance/VoucherDetailPage').then((m) => ({ default: m.VoucherDetailPage })))
const PaymentsPage = lazy(() => import('@/pages/finance/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const LedgerPage = lazy(() => import('@/pages/finance/LedgerPage').then((m) => ({ default: m.LedgerPage })))
const AdjustmentsPage = lazy(() => import('@/pages/finance/AdjustmentsPage').then((m) => ({ default: m.AdjustmentsPage })))
const FinancePoliciesPage = lazy(() => import('@/pages/finance/FinancePoliciesPage').then((m) => ({ default: m.FinancePoliciesPage })))
const DefaultersReportPage = lazy(() => import('@/pages/finance/DefaultersReportPage').then((m) => ({ default: m.DefaultersReportPage })))
const CollectionReportPage = lazy(() => import('@/pages/finance/CollectionReportPage').then((m) => ({ default: m.CollectionReportPage })))
const AgingReportPage = lazy(() => import('@/pages/finance/AgingReportPage').then((m) => ({ default: m.AgingReportPage })))
const StudentStatementPage = lazy(() => import('@/pages/finance/StudentStatementPage').then((m) => ({ default: m.StudentStatementPage })))
const StudentFinancePage = lazy(() => import('@/pages/finance/StudentFinancePage').then((m) => ({ default: m.StudentFinancePage })))
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })))
const RolesPage = lazy(() => import('@/pages/admin/RolesPage').then((m) => ({ default: m.RolesPage })))
const AuditLog = lazy(() => import('@/pages/admin/AuditLog').then((m) => ({ default: m.AuditLog })))
const StudentsImportPage = lazy(() => import('@/pages/admin/StudentsImportPage').then((m) => ({ default: m.StudentsImportPage })))
const FacultyImportPage = lazy(() => import('@/pages/admin/FacultyImportPage').then((m) => ({ default: m.FacultyImportPage })))
const SyllabusManagerPage = lazy(() => import('@/pages/admin/SyllabusManagerPage').then((m) => ({ default: m.SyllabusManagerPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })))

/**
 * Application routes.
 * Public: /login and /verify/:token (transcript QR verification).
 * Protected: everything inside the DashboardLayout.  Each protected route names
 * its path pattern, which must be registered in `config/routeAccess.ts`
 * (unregistered routes are denied).
 *
 * Every route component is lazy-loaded, and ProtectedRoute wraps its children
 * in a single shared <Suspense> boundary, so the loading fallback is defined once.
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
    path: '/verify/:token',
    element: (
      <Suspense fallback={<PublicRouteFallback />}>
        <TranscriptVerify />
      </Suspense>
    ),
  },
  {
    path: '/change-password-required',
    element: (
      <ProtectedRoute path="/change-password-required">
        <MandatoryPasswordChangePage />
      </ProtectedRoute>
    ),
  },
  {
    // Layout route: renders the shared sidebar/topbar/breadcrumbs chrome once
    // and mounts the active page into its <Outlet/>.
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute path="/dashboard">
            <DashboardHome />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/admin',
        element: (
          <ProtectedRoute path="/dashboard/admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/registrar',
        element: (
          <ProtectedRoute path="/dashboard/registrar">
            <RegistrarDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/faculty',
        element: (
          <ProtectedRoute path="/dashboard/faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/student',
        element: (
          <ProtectedRoute path="/dashboard/student">
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/onboarding',
        element: (
          <ProtectedRoute path="/student/onboarding">
            <StudentOnboardingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/examcell',
        element: (
          <ProtectedRoute path="/dashboard/examcell">
            <ExamCellDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/coordinator',
        element: (
          <ProtectedRoute path="/dashboard/coordinator">
            <CoordinatorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/office-assistant',
        element: (
          <ProtectedRoute path="/dashboard/office-assistant">
            <OfficeAssistantDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/demo/datatable',
        element: (
          <ProtectedRoute path="/demo/datatable">
            <DataTableDemo />
          </ProtectedRoute>
        ),
      },
      {
        path: '/demo/style-guide',
        element: (
          <ProtectedRoute path="/demo/style-guide">
            <StyleGuidePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/notifications',
        element: (
          <ProtectedRoute path="/notifications">
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/notifications/manage',
        element: (
          <ProtectedRoute path="/notifications/manage">
            <NotificationAdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute path="/profile">
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics',
        element: (
          <ProtectedRoute path="/analytics">
            <AnalyticsDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/people',
        element: (
          <ProtectedRoute path="/people">
            <PeopleListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/people/:id',
        element: (
          <ProtectedRoute path="/people/:id">
            <PersonDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/students',
        element: (
          <ProtectedRoute path="/students">
            <StudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/students/:id',
        element: (
          <ProtectedRoute path="/students/:id">
            <StudentDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/compliance',
        element: (
          <ProtectedRoute path="/compliance">
            <ComplianceAdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-compliance',
        element: (
          <ProtectedRoute path="/my-compliance">
            <MyCompliancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/courses',
        element: (
          <ProtectedRoute path="/courses">
            <CoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/sections',
        element: (
          <ProtectedRoute path="/sections">
            <SectionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/sections/:id',
        element: (
          <ProtectedRoute path="/sections/:id">
            <SectionDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/programs',
        element: (
          <ProtectedRoute path="/academics/programs">
            <ProgramsListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/programs/new',
        element: (
          <ProtectedRoute path="/academics/programs/new">
            <ProgramFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/programs/:id',
        element: (
          <ProtectedRoute path="/academics/programs/:id">
            <ProgramDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/batches',
        element: (
          <ProtectedRoute path="/academics/batches">
            <BatchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/periods',
        element: (
          <ProtectedRoute path="/academics/periods">
            <AcademicPeriodsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/groups',
        element: (
          <ProtectedRoute path="/academics/groups">
            <GroupsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/academics/departments',
        element: (
          <ProtectedRoute path="/academics/departments">
            <DepartmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/timetable',
        element: (
          <ProtectedRoute path="/timetable">
            <TimetablePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance',
        element: (
          <ProtectedRoute path="/attendance">
            <AttendanceDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/input',
        element: (
          <ProtectedRoute path="/attendance/input">
            <AttendanceInputPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/bulk',
        element: (
          <ProtectedRoute path="/attendance/bulk">
            <BulkAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/eligibility',
        element: (
          <ProtectedRoute path="/attendance/eligibility">
            <EligibilityReport />
          </ProtectedRoute>
        ),
      },
      {
        path: '/learning',
        element: (
          <ProtectedRoute path="/learning">
            <LearningFeedPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/learning/manage',
        element: (
          <ProtectedRoute path="/learning/manage">
            <LearningMaterialsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/exams',
        element: (
          <ProtectedRoute path="/exams">
            <ExamsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/gradebook',
        element: (
          <ProtectedRoute path="/gradebook">
            <GradebookPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/results',
        element: (
          <ProtectedRoute path="/results">
            <ResultsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/results/corrections',
        element: (
          <ProtectedRoute path="/results/corrections">
            <ResultCorrectionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/results/:id',
        element: (
          <ProtectedRoute path="/results/:id">
            <ResultDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/examcell/publish',
        element: (
          <ProtectedRoute path="/examcell/publish">
            <PublishResults />
          </ProtectedRoute>
        ),
      },
      {
        path: '/transcripts',
        element: (
          <ProtectedRoute path="/transcripts">
            <TranscriptsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance',
        element: (
          <ProtectedRoute path="/finance">
            <FinanceDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/fee-types',
        element: (
          <ProtectedRoute path="/finance/fee-types">
            <FeeTypesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/fee-plans',
        element: (
          <ProtectedRoute path="/finance/fee-plans">
            <FeePlansPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/vouchers',
        element: (
          <ProtectedRoute path="/finance/vouchers">
            <VoucherGenerationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/vouchers/list',
        element: (
          <ProtectedRoute path="/finance/vouchers/list">
            <VouchersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/vouchers/:id',
        element: (
          <ProtectedRoute path="/finance/vouchers/:id">
            <VoucherDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/payments',
        element: (
          <ProtectedRoute path="/finance/payments">
            <PaymentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/ledger',
        element: (
          <ProtectedRoute path="/finance/ledger">
            <LedgerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/adjustments',
        element: (
          <ProtectedRoute path="/finance/adjustments">
            <AdjustmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/policies',
        element: (
          <ProtectedRoute path="/finance/policies">
            <FinancePoliciesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/reports/defaulters',
        element: (
          <ProtectedRoute path="/finance/reports/defaulters">
            <DefaultersReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/reports/collection',
        element: (
          <ProtectedRoute path="/finance/reports/collection">
            <CollectionReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/reports/aging',
        element: (
          <ProtectedRoute path="/finance/reports/aging">
            <AgingReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/reports/statement',
        element: (
          <ProtectedRoute path="/finance/reports/statement">
            <StudentStatementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finance/me',
        element: (
          <ProtectedRoute path="/finance/me">
            <StudentFinancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/users',
        element: (
          <ProtectedRoute path="/system/users">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/roles',
        element: (
          <ProtectedRoute path="/system/roles">
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/audit',
        element: (
          <ProtectedRoute path="/system/audit">
            <AuditLog />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/students/import',
        element: (
          <ProtectedRoute path="/system/students/import">
            <StudentsImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/faculty/import',
        element: (
          <ProtectedRoute path="/system/faculty/import">
            <FacultyImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/syllabus',
        element: (
          <ProtectedRoute path="/system/syllabus">
            <SyllabusManagerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/system/settings',
        element: (
          <ProtectedRoute path="/system/settings">
            <AdminSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <ProtectedRoute path="*">
            <NotFoundPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
