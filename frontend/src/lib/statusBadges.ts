import { BadgeVariant } from '@/components/ui/Badge'

/**
 * Centralized status -> Badge variant registry.
 *
 * Before this, each feature (students, timetable, results, imports,
 * dashboards, finance, audit) mapped its own status strings to Badge
 * variants inline, so the same word ("pending", "approved") could render a
 * different color depending on which page you were on. Domains are kept
 * separate (rather than one flat map) because the same word can mean
 * different things in different domains, and status casing varies by
 * backend serializer (e.g. results uses UPPER_SNAKE, students uses
 * TitleCase).
 */
export type StatusDomain =
  | 'student'
  | 'timetable'
  | 'results'
  | 'import'
  | 'attendance'
  | 'finance'
  | 'audit'
  | 'health'
  | 'record'

const registries: Record<StatusDomain, Record<string, BadgeVariant>> = {
  student: {
    Active: 'success',
    Graduated: 'info',
    Inactive: 'warning',
    Suspended: 'danger',
    Approved: 'success',
    Pending: 'warning',
    Rejected: 'danger',
    // Lowercase variants used by a couple of dashboard call sites.
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
  },
  timetable: {
    published: 'success',
    draft: 'warning',
    cancelled: 'danger',
    scheduled: 'info',
    // Entry-level (per-session) statuses from the mobile schedule contract,
    // distinct from the week-level publish status above.
    SCHEDULED: 'success',
    CANCELLED: 'danger',
    COMPLETED: 'default',
  },
  results: {
    PUBLISHED: 'success',
    FROZEN: 'success',
    DRAFT: 'warning',
    PENDING: 'warning',
    VERIFIED: 'info',
    ready: 'success',
  },
  import: {
    COMMITTED: 'success',
    PREVIEWED: 'primary',
    FAILED: 'danger',
    PENDING: 'warning',
  },
  attendance: {
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    EXCUSED: 'info',
    // Eligibility-report verdicts (attendance-percentage-derived, not a raw
    // per-session status, but the same domain conceptually).
    ELIGIBLE: 'success',
    INELIGIBLE: 'danger',
  },
  finance: {
    // Voucher.status (backend/sims_backend/finance/models.py) — lowercase,
    // snake_case, verified against the real STATUS_CHOICES (the earlier
    // guessed UPPERCASE PAID/PARTIAL/UNPAID/OVERDUE/VOID values below never
    // matched anything the API actually returns).
    generated: 'info',
    partially_paid: 'warning',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'default',
    // Payment.status
    received: 'info',
    verified: 'success',
    rejected: 'danger',
    // Adjustment.status (waiver/scholarship/adjustment requests)
    pending: 'warning',
    approved: 'success',
    // LedgerEntry has no status field — it's derived client-side from
    // voided_at (see StudentStatementPage/VouchersPage) into this label.
    Void: 'default',
  },
  audit: {
    SUCCESS: 'success',
    FAILURE: 'danger',
    WARNING: 'warning',
  },
  health: {
    ok: 'success',
    degraded: 'warning',
    error: 'danger',
    down: 'danger',
  },
  // Generic on/off record state, shared by any entity with a plain
  // is_active flag (users, syllabus items, batches, ...) rather than a
  // richer lifecycle — unlike `student`, where "Inactive" carries more
  // specific meaning alongside Graduated/Suspended.
  record: {
    Active: 'success',
    Inactive: 'default',
  },
}

/**
 * Resolve a domain-specific status string to a Badge variant. Falls back to
 * 'default' for unrecognized statuses rather than throwing, since backend
 * status vocab can grow without a matching frontend release.
 */
export function statusVariant(domain: StatusDomain, status: string | null | undefined): BadgeVariant {
  if (!status) return 'default'
  return registries[domain][status] ?? 'default'
}
