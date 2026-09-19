import api from '@/api/axios'

type FormValue = string | number | boolean | Blob | null | undefined | Array<string | number | boolean | Blob>

/**
 * Build a multipart body: skips null/undefined, sends booleans as "true"/"false",
 * and repeats the key for array values (how DRF reads multi-value fields).
 */
export function toFormData(values: Record<string, FormValue>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue
    const items = Array.isArray(value) ? value : [value]
    for (const item of items) {
      form.append(key, item instanceof Blob ? item : String(item))
    }
  }
  return form
}

export async function postMultipart<T>(url: string, values: Record<string, FormValue>): Promise<T> {
  const response = await api.post<T>(url, toFormData(values))
  return response.data
}

export async function patchMultipart<T>(url: string, values: Record<string, FormValue>): Promise<T> {
  const response = await api.patch<T>(url, toFormData(values))
  return response.data
}
