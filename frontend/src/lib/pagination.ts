/** DRF page-number pagination envelope. */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PageParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
}

/** Accept either a paginated envelope or a bare array (some endpoints are unpaginated). */
export function resultsOf<T>(data: Paginated<T> | T[] | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results
}

export function countOf<T>(data: Paginated<T> | T[] | undefined): number {
  if (!data) return 0
  return Array.isArray(data) ? data.length : data.count
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
