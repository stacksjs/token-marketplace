/**
 * Shared helpers for Action handlers.
 */

/**
 * Apply pagination to a query result array.
 * Returns { data, total, page, limit, totalPages }
 */
export function paginate<T>(items: T[], page: number = 1, limit: number = 20): {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
} {
  const validPage = Math.max(1, page)
  const validLimit = Math.min(100, Math.max(1, limit))
  const total = items.length
  const totalPages = Math.ceil(total / validLimit)
  const offset = (validPage - 1) * validLimit
  const data = items.slice(offset, offset + validLimit)
  return { data, total, page: validPage, limit: validLimit, totalPages }
}

/** Generate a URL-safe slug from a name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Transform snake_case keys to camelCase.
 * Optionally parse JSON string fields by passing their snake_case key names.
 */
export function toCamelCase(obj: Record<string, any>, jsonFields?: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  const jsonSet = jsonFields ? new Set(jsonFields) : null
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    if (jsonSet?.has(key) && typeof value === 'string') {
      try {
        result[camelKey] = JSON.parse(value)
      } catch {
        result[camelKey] = value
      }
    } else {
      result[camelKey] = value
    }
  }
  return result
}
