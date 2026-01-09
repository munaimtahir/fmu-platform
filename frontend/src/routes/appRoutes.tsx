import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
// LegacyRouteGuard removed - all legacy routes have been deleted
import { DashboardHome } from '@/pages/DashboardHome'
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard'
import { RegistrarDashboard } from '@/pages/dashboards/RegistrarDashboard'
import { FacultyDashboard } from '@/pages/dashboards/FacultyDashboard'
import { StudentDashboard } from '@/pages/dashboards/StudentDashboard'
import { ExamCellDashboard } from '@/pages/dashboards/ExamCellDashboard'
import { DataTableDemo } from '@/pages/demo/DataTableDemo'
import { AttendanceDashboard } from '@/pages/attendance/AttendanceDashboard'
import { EligibilityReport } from '@/pages/attendance/EligibilityReport'
import { AttendanceInputPage } from '@/pages/attendance/AttendanceInputPage'
import { Gradebook } from '@/pages/gradebook/Gradebook'
import { PublishResults } from '@/pages/examcell/PublishResults'
import { TranscriptVerify } from '@/pages/verify/TranscriptVerify'
import { AuditLog } from '@/pages/admin/AuditLog'
import { StudentsImportPage } from '@/pages/admin/StudentsImportPage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { CoursesPage } from '@/features/courses/CoursesPage'
import { SectionsPage } from '@/features/sections/SectionsPage'
// Legacy assessments removed
// Legacy enrollment removed
import { BulkAttendancePage } from '@/features/attendance/BulkAttendancePage'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'
import { StudentApplicationPage } from '@/pages/StudentApplicationPage'
import { FinanceDashboard } from '@/pages/finance/FinanceDashboard'
import { FeePlansPage } from '@/pages/finance/FeePlansPage'
import { VoucherGenerationPage } from '@/pages/finance/VoucherGenerationPage'
import { StudentFinancePage } from '@/pages/finance/StudentFinancePage'
import { DefaultersReportPage } from '@/pages/finance/DefaultersReportPage'
import { CollectionReportPage } from '@/pages/finance/CollectionReportPage'
import { AgingReportPage } from '@/pages/finance/AgingReportPage'
import { StudentStatementPage } from '@/pages/finance/StudentStatementPage'
import { VouchersPage } from '@/pages/finance/VouchersPage'
import { PaymentsPage } from '@/pages/finance/PaymentsPage'
import { TimetablePage } from '@/features/timetable/TimetablePage'
import { ProfilePage } from '@/pages/ProfilePage'
// UnauthorizedPage is imported dynamically in ProtectedRoute to avoid circular dependencies
import { UsersPage } from '@/pages/admin/UsersPage'
import { RolesPage } from '@/pages/admin/RolesPage'
// ProgramsPage removed - using ProgramsListPage instead
import { ProgramsListPage } from '@/pages/academics/ProgramsListPage'
import { ProgramDetailPage } from '@/pages/academics/ProgramDetailPage'
import { ProgramFormPage } from '@/pages/academics/ProgramFormPage'
import { BatchesPage } from '@/pages/academics/BatchesPage'
import { AcademicPeriodsPage } from '@/pages/academics/AcademicPeriodsPage'
import { GroupsPage } from '@/pages/academics/GroupsPage'
import { DepartmentsPage } from '@/pages/academics/DepartmentsPage'
import { ExamsPage } from '@/pages/exams/ExamsPage'
import { ResultsPage } from '@/pages/results/ResultsPage'
// Legacy requests removed
import { TranscriptsPage } from '@/pages/transcripts/TranscriptsPage'
// UnauthorizedPage is imported dynamically in ProtectedRoute to avoid circular dependencies

/**
 * Application routes configuration
 * Public routes: /login
 * Protected routes: /dashboard and role-specific dashboards
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/apply',
    element: <StudentApplicationPage />,
  },
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
    element: (
      <ProtectedRoute allowedRoles={['Faculty', 'Student', 'Admin']}>
        <Gradebook />
      </ProtectedRoute>
    ),
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
    element: <TranscriptVerify />,
  },
  {
    path: '/admin/audit',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AuditLog />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/students/import',
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
      <ProtectedRoute allowedRoles={['Admin', 'Faculty', 'Registrar', 'Coordinator']}>
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
    path: '/admin/users',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/admin/users">
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/roles',
    element: (
      <ProtectedRoute allowedRoles={['Admin']} path="/admin/roles">
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
      <ProtectedRoute allowedRoles={['Admin', 'Registrar', 'Student']} path="/transcripts">
        <TranscriptsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
