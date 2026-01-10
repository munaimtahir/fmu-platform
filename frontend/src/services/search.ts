/**
 * Global Search API service
 * Searches across multiple entities: Students, Courses, Sections, Programs
 */
import { studentsService } from './students'
import { coursesService } from './courses'
import { sectionsService } from './sections'
import { programsService } from './programs'
import { Student, Course, Section, Program } from '@/types'

export interface SearchResult {
  id: number
  type: 'student' | 'course' | 'section' | 'program'
  title: string
  subtitle?: string
  route: string
  data: Student | Course | Section | Program
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
}

/**
 * Global search service that searches across all entities
 */
export const searchService = {
  /**
   * Search across Students, Courses, Sections, and Programs
   * Returns top 5 results from each category (max 20 total)
   */
  async search(query: string): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 }
    }

    const searchQuery = query.trim()
    const limit = 5 // Limit results per category

    try {
      // Search all entities in parallel
      const [studentsRes, coursesRes, sectionsRes, programsRes] = await Promise.all([
        studentsService.getAll({ search: searchQuery, page: 1 }).catch(() => ({ results: [], count: 0 })),
        coursesService.getAll({ search: searchQuery, page: 1 }).catch(() => ({ results: [], count: 0 })),
        sectionsService.getAll({ search: searchQuery, page: 1 }).catch(() => ({ results: [], count: 0 })),
        programsService.getAll({ search: searchQuery, page: 1, is_active: true }).catch(() => ({ results: [], count: 0 })),
      ])

      const results: SearchResult[] = []

      // Process Students
      if (studentsRes.results) {
        studentsRes.results.slice(0, limit).forEach((student: Student) => {
          results.push({
            id: student.id,
            type: 'student',
            title: student.name || student.reg_no,
            subtitle: student.reg_no || student.program_name,
            route: `/students`,
            data: student,
          })
        })
      }

      // Process Courses
      if (coursesRes.results) {
        coursesRes.results.slice(0, limit).forEach((course: any) => {
          // Handle Course with actual API structure
          const courseTitle = course.name || course.title || `Course ${course.id}`
          const courseCode = course.code || ''
          const departmentInfo = course.department_name || ''
          const subtitle = courseCode 
            ? (departmentInfo ? `${courseCode} • ${departmentInfo}` : courseCode)
            : departmentInfo

          results.push({
            id: course.id,
            type: 'course',
            title: courseTitle,
            subtitle: subtitle,
            route: `/courses`,
            data: course,
          })
        })
      }

      // Process Sections
      if (sectionsRes.results) {
        sectionsRes.results.slice(0, limit).forEach((section: any) => {
          // Handle Section with actual API structure
          const sectionName = section.name || `Section ${section.id}`
          const courseInfo = section.course_name || section.course_code || `Course ID: ${section.course}`
          const subtitle = section.faculty_username 
            ? `${courseInfo} • ${section.faculty_username}` 
            : courseInfo

          results.push({
            id: section.id,
            type: 'section',
            title: sectionName,
            subtitle: subtitle,
            route: `/sections`,
            data: section,
          })
        })
      }

      // Process Programs
      if (programsRes.results) {
        programsRes.results.slice(0, limit).forEach((program: any) => {
          // Handle Program with actual API structure
          const programName = program.name || `Program ${program.id}`
          const programDescription = program.description || ''
          
          results.push({
            id: program.id,
            type: 'program',
            title: programName,
            subtitle: programDescription || program.structure_type || 'Academic Program',
            route: `/academics/programs`,
            data: program,
          })
        })
      }

      return {
        results,
        total: results.length,
      }
    } catch (error) {
      console.error('Global search error:', error)
      return { results: [], total: 0 }
    }
  },
}
