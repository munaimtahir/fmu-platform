import api from '@/api/axios'
import type { Paginated } from '@/lib/pagination'
import { attendanceService } from './attendance'

export interface EligibilitySection {
  id: number
  name: string
  course_code?: string
  course_name?: string
  academic_period_name?: string
  group: number | null
  group_name?: string
}

export interface EligibilityRow {
  student_id: number
  reg_no: string
  student_name: string
  section_id: number
  attendance_percentage: number
  threshold: number
  eligible: boolean
}

interface RosterStudent {
  id: number
  reg_no: string
  name: string
}

export function sectionLabel(section: EligibilitySection): string {
  return [section.course_code, section.name, section.academic_period_name && `(${section.academic_period_name})`]
    .filter(Boolean)
    .join(' ')
}

export async function listSections(search?: string): Promise<EligibilitySection[]> {
  const response = await api.get<Paginated<EligibilitySection>>('/api/academics/sections/', {
    params: { search: search || undefined },
  })
  return response.data.results
}

/** Every student in a group (follows the paginator). */
export async function fetchGroupRoster(groupId: number): Promise<RosterStudent[]> {
  const roster: RosterStudent[] = []
  for (let page = 1; ; page += 1) {
    const response = await api.get<Paginated<RosterStudent>>('/api/students/', { params: { group: groupId, page } })
    roster.push(...response.data.results)
    if (!response.data.next) return roster
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

/**
 * Eligibility for every student of each chosen section, via /api/attendance/eligibility/
 * (the backend evaluates one student at a time).  Sections without a group have no roster.
 */
export async function buildEligibilityReport(
  sections: EligibilitySection[],
  threshold: number,
  onProgress?: (done: number, total: number) => void
): Promise<EligibilityRow[]> {
  const jobs: Array<{ section: EligibilitySection; student: RosterStudent }> = []
  for (const section of sections) {
    if (section.group === null) continue
    const roster = await fetchGroupRoster(section.group)
    roster.forEach((student) => jobs.push({ section, student }))
  }

  let done = 0
  return mapWithConcurrency(jobs, 5, async ({ section, student }) => {
    const result = await attendanceService.getEligibility({ studentId: student.id, sectionId: section.id, threshold })
    onProgress?.(++done, jobs.length)
    return {
      student_id: student.id,
      reg_no: student.reg_no,
      student_name: student.name,
      section_id: section.id,
      attendance_percentage: result.attendance_percentage,
      threshold: result.threshold,
      eligible: result.eligible,
    }
  })
}

const csvCell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`

export function eligibilityToCsv(rows: EligibilityRow[]): string {
  const header = ['Reg No', 'Student Name', 'Section ID', 'Attendance %', 'Threshold %', 'Eligible']
  const lines = rows.map((row) =>
    [row.reg_no, row.student_name, row.section_id, row.attendance_percentage.toFixed(2), row.threshold, row.eligible ? 'Yes' : 'No']
      .map(csvCell)
      .join(',')
  )
  return [header.map(csvCell).join(','), ...lines].join('\n')
}
