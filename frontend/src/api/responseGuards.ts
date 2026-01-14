/**
 * Lightweight runtime guards for API response shape validation.
 * 
 * These guards help catch API contract mismatches early in development.
 * They are lightweight checks that validate expected response structures
 * without being overly strict (allowing for additional fields).
 */

/**
 * Validates that a response has the expected paginated structure.
 * @param data The response data to validate
 * @param itemValidator Optional validator for individual items
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validatePaginatedResponse<T>(
  data: unknown,
  itemValidator?: (item: unknown) => item is T
): asserts data is { results: T[]; count: number; next?: string | null; previous?: string | null } {
  if (!data || typeof data !== 'object') {
    throw new Error('Response is not an object')
  }

  const response = data as Record<string, unknown>

  if (!Array.isArray(response.results)) {
    throw new Error('Paginated response missing "results" array')
  }

  if (typeof response.count !== 'number') {
    throw new Error('Paginated response missing "count" number')
  }

  // Optionally validate items if validator provided
  if (itemValidator) {
    for (const item of response.results) {
      if (!itemValidator(item)) {
        throw new Error(`Invalid item in paginated response: ${JSON.stringify(item)}`)
      }
    }
  }
}

/**
 * Validates that a response has an ID field (common for model objects).
 * @param data The response data to validate
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validateHasId(data: unknown): asserts data is { id: number | string } {
  if (!data || typeof data !== 'object') {
    throw new Error('Response is not an object')
  }

  const obj = data as Record<string, unknown>
  if (obj.id === undefined || (typeof obj.id !== 'number' && typeof obj.id !== 'string')) {
    throw new Error('Response missing "id" field')
  }
}

/**
 * Validates a student response shape (matches StudentSerializer).
 * @param data The response data to validate
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validateStudentResponse(data: unknown): asserts data is {
  id: number
  reg_no: string
  name: string
  program?: number
  batch?: number
  group?: number
  status?: string
} {
  validateHasId(data)
  const obj = data as Record<string, unknown>
  
  if (typeof obj.reg_no !== 'string') {
    throw new Error('Student response missing "reg_no" string')
  }
  if (typeof obj.name !== 'string') {
    throw new Error('Student response missing "name" string')
  }
}

/**
 * Validates an attendance response shape (matches AttendanceSerializer).
 * @param data The response data to validate
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validateAttendanceResponse(data: unknown): asserts data is {
  id: number
  session: number
  student: number
  status: string
  marked_by?: number
} {
  validateHasId(data)
  const obj = data as Record<string, unknown>
  
  if (typeof obj.session !== 'number') {
    throw new Error('Attendance response missing "session" number')
  }
  if (typeof obj.student !== 'number') {
    throw new Error('Attendance response missing "student" number')
  }
  if (typeof obj.status !== 'string') {
    throw new Error('Attendance response missing "status" string')
  }
}

/**
 * Validates a result header response shape (matches ResultHeaderSerializer).
 * @param data The response data to validate
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validateResultHeaderResponse(data: unknown): asserts data is {
  id: number
  exam: number
  student: number
  total_obtained?: number
  total_max?: number
  final_outcome?: string
  status?: string
} {
  validateHasId(data)
  const obj = data as Record<string, unknown>
  
  if (typeof obj.exam !== 'number') {
    throw new Error('Result header response missing "exam" number')
  }
  if (typeof obj.student !== 'number') {
    throw new Error('Result header response missing "student" number')
  }
}

/**
 * Development-only guard that logs warnings instead of throwing errors.
 * Use this in production code where you want to detect issues but not break the app.
 */
export function warnOnInvalidResponse(
  validator: (data: unknown) => asserts data is unknown,
  data: unknown,
  endpoint: string
): void {
  if (import.meta.env.DEV) {
    try {
      validator(data)
    } catch (error) {
      console.warn(`[API Guard] Invalid response shape from ${endpoint}:`, error)
    }
  }
}
