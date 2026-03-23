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

/**
 * Convert a raw NFT image URL to a CDN-proxied URL with resizing.
 *
 * Usage in STX views:
 *   <img src="{{ cdnImage(nft.image, 400) }}" />
 *
 * Generates: /api/media/image?url=https://arweave.net/abc&w=400&f=webp
 */
export function cdnImage(url: string, width: number = 400, format: string = 'webp'): string {
  if (!url) return '/assets/images/placeholder-nft.png'

  // If already a local/CDN URL, return as-is
  if (url.startsWith('/')) return url

  return `/api/media/image?url=${encodeURIComponent(url)}&w=${width}&f=${format}`
}

/** Preset size helpers for common NFT image dimensions. */
export const imageSizes = {
  thumbnail: (url: string) => cdnImage(url, 150),
  card: (url: string) => cdnImage(url, 400),
  detail: (url: string) => cdnImage(url, 800),
  full: (url: string) => cdnImage(url, 1200),
}
