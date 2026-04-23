/**
 * Deterministic test data constants aligned with the Frozen Pilot Baseline.
 *
 * Authoritative source: docs/_freeze/06_PILOT_BASELINE_POLICY.md
 */

export const USERS = {
  admin: {
    username: 'pilot_admin',
    password: 'password123',
    role: 'Admin',
    email: 'pilot_admin@local.test',
  },
  registrar: {
    username: 'pilot_registrar',
    password: 'password123',
    role: 'Registrar',
    email: 'pilot_registrar@local.test',
  },
  faculty: {
    username: 'pilot_faculty',
    password: 'password123',
    role: 'Faculty',
    email: 'pilot_faculty@local.test',
  },
  student: {
    username: 'pilot_student',
    password: 'password123',
    role: 'Student',
    email: 'pilot_student@local.test',
  },
  examcell: {
    username: 'pilot_examcell',
    password: 'password123',
    role: 'ExamCell',
    email: 'pilot_examcell@local.test',
  },
  coordinator: {
    username: 'pilot_coordinator',
    password: 'password123',
    role: 'Coordinator',
    email: 'pilot_coordinator@local.test',
  },
  office: {
    username: 'pilot_office',
    password: 'password123',
    role: 'Office Asst',
    email: 'pilot_office@local.test',
  },
} as const;

export type RoleName = keyof typeof USERS;

/** Auth state file paths for storageState reuse */
export const AUTH_STATE_FILES = {
  admin: 'auth/.auth/admin.json',
  registrar: 'auth/.auth/registrar.json',
  faculty: 'auth/.auth/faculty.json',
  student: 'auth/.auth/student.json',
  examcell: 'auth/.auth/examcell.json',
} as const;

/** 
 * Academic data seeded by baseline (currently Zero-Data).
 * Tests depending on these must be isolated from Smoke/Auth.
 */
export const SEED_DATA = {
  program: 'MBBS',
  term: 'Block-1',
  sections: [],
  courses: [],
  demoFaculty: [],
  demoStudentPrefix: 'pilot_student',
  demoStudentPassword: 'password123',
} as const;

/** Routes under test with their access rules */
export const ROUTES = {
  public: {
    login: '/login',
    apply: '/apply',
    transcriptVerify: (token: string) => `/verify/${token}`,
  },
  protected: {
    dashboard: '/dashboard',
    adminDashboard: '/dashboard/admin',
    registrarDashboard: '/dashboard/registrar',
    facultyDashboard: '/dashboard/faculty',
    studentDashboard: '/dashboard/student',
    examcellDashboard: '/dashboard/examcell',
  },
  students: {
    list: '/students',
  },
  academics: {
    programs: '/academics/programs',
    batches: '/academics/batches',
    periods: '/academics/periods',
    groups: '/academics/groups',
    departments: '/academics/departments',
  },
  admin: {
    users: '/system/users',
    roles: '/system/roles',
    audit: '/system/audit',
    dashboard: '/system/dashboard',
    settings: '/system/settings',
    syllabus: '/system/syllabus',
    studentsImport: '/system/students/import',
  },
  courses: '/courses',
  sections: '/sections',
  attendance: {
    dashboard: '/attendance',
    input: '/attendance/input',
    bulk: '/attendance/bulk',
    eligibility: '/attendance/eligibility',
  },
  gradebook: '/gradebook',
  exams: '/exams',
  results: '/results',
  examcell: {
    publish: '/examcell/publish',
  },
  transcripts: '/transcripts',
  profile: '/profile',
  timetable: '/timetable',
  finance: {
    dashboard: '/finance',
    feePlans: '/finance/fee-plans',
    me: '/finance/me',
  },
  analytics: '/analytics',
} as const;

/** Role → routes that SHOULD be accessible */
export const ROLE_ALLOWED_ROUTES: Record<RoleName, string[]> = {
  admin: [
    ROUTES.protected.dashboard,
    ROUTES.protected.adminDashboard,
    ROUTES.students.list,
    ROUTES.academics.programs,
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.attendance.dashboard,
    ROUTES.attendance.eligibility,
    ROUTES.gradebook,
    ROUTES.examcell.publish,
    ROUTES.transcripts,
    ROUTES.results,
    ROUTES.analytics,
  ],
  registrar: [
    ROUTES.protected.dashboard,
    ROUTES.protected.registrarDashboard,
    ROUTES.students.list,
    ROUTES.academics.programs,
    ROUTES.academics.batches,
    ROUTES.attendance.eligibility,
    ROUTES.transcripts,
  ],
  faculty: [
    ROUTES.protected.dashboard,
    ROUTES.protected.facultyDashboard,
    ROUTES.attendance.dashboard,
    ROUTES.attendance.input,
    ROUTES.gradebook,
    ROUTES.courses,
    ROUTES.sections,
    ROUTES.results,
  ],
  student: [
    ROUTES.protected.dashboard,
    ROUTES.protected.studentDashboard,
    ROUTES.gradebook,
    ROUTES.results,
    ROUTES.transcripts,
    ROUTES.finance.me,
  ],
  examcell: [
    ROUTES.protected.dashboard,
    ROUTES.protected.examcellDashboard,
    ROUTES.examcell.publish,
    ROUTES.exams,
    ROUTES.results,
    ROUTES.transcripts,
  ],
  coordinator: [
    ROUTES.protected.dashboard,
    ROUTES.students.list,
    ROUTES.academics.programs,
  ],
  office: [
    ROUTES.protected.dashboard,
    ROUTES.students.list,
  ],
};

/** Routes that should be FORBIDDEN for a given role */
export const ROLE_FORBIDDEN_ROUTES: Record<RoleName, string[]> = {
  admin: [], 
  registrar: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.admin.settings,
    ROUTES.attendance.dashboard,
    ROUTES.examcell.publish,
    ROUTES.analytics,
  ],
  faculty: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.students.list,
    ROUTES.attendance.eligibility,
    ROUTES.examcell.publish,
    ROUTES.analytics,
  ],
  student: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.students.list,
    ROUTES.academics.programs,
    ROUTES.attendance.dashboard,
    ROUTES.attendance.input,
    ROUTES.attendance.eligibility,
    ROUTES.examcell.publish,
    ROUTES.analytics,
    ROUTES.protected.adminDashboard,
    ROUTES.protected.facultyDashboard,
    ROUTES.protected.registrarDashboard,
    ROUTES.protected.examcellDashboard,
  ],
  examcell: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.students.list,
    ROUTES.attendance.input,
    ROUTES.attendance.eligibility,
    ROUTES.analytics,
    ROUTES.protected.adminDashboard,
    ROUTES.protected.registrarDashboard,
    ROUTES.protected.facultyDashboard,
  ],
  coordinator: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.admin.settings,
  ],
  office: [
    ROUTES.admin.users,
    ROUTES.admin.audit,
    ROUTES.admin.settings,
  ],
};

/** API base URL - resolved from env at runtime */
export const API_BASE = process.env.VITE_API_URL || 'http://localhost:8010/api';
