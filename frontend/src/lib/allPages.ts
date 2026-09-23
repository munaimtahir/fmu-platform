import api from '@/api/axios'
import type { Paginated } from './pagination'

/** Fetch complete option lists without silently dropping later pages. */
export async function allPages<T>(path: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; ; page += 1) {
    const { data } = await api.get<Paginated<T> | T[]>(path, { params: { ...params, page } })
    if (Array.isArray(data)) return [...items, ...data]
    items.push(...data.results)
    if (!data.next) return items
  }
}
