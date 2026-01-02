import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
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
import { AssessmentsPage } from '@/features/assessments/AssessmentsPage'
import { BulkEnrollmentPage } from '@/features/enrollment/BulkEnrollmentPage'
import { BulkAttendancePage } from '@/features/attendance/BulkAttendancePage'
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard'
import { StudentApplicationPage } from '@/pages/StudentApplicationPage'
import { FinanceDashboard } from '@/pages/finance/FinanceDashboard'
import { FeePlansPage } from '@/pages/finance/FeePlansPage'
import { VoucherGenerationPage } from '@/pages/finance/VoucherGenerationPage'
import { StudentFinancePage } from '@/pages/finance/StudentFinancePage'

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
  {
    path: '/assessments',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Faculty']}>
        <AssessmentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/enrollment/bulk',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Registrar']}>
        <BulkEnrollmentPage />
      </ProtectedRoute>
    ),
  },
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
    path: '/finance/me',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <StudentFinancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
