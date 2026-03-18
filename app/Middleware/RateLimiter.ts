/**
 * Simple in-memory rate limiter for marketplace endpoints.
 * In production, use Redis-backed rate limiting.
 */

interface RateEntry {
  count: number
  resetAt: number
}

const store: Map<string, RateEntry> = new Map()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 60000)

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean, remaining: number, retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

// Pre-configured limiters for different endpoint types
export const rateLimiters = {
  mint: (wallet: string) => rateLimit(`mint:${wallet}`, 3, 60000), // 3 per minute
  offer: (wallet: string) => rateLimit(`offer:${wallet}`, 10, 60000), // 10 per minute
  listing: (wallet: string) => rateLimit(`listing:${wallet}`, 20, 60000), // 20 per minute
  search: (ip: string) => rateLimit(`search:${ip}`, 30, 60000), // 30 per minute
  api: (ip: string) => rateLimit(`api:${ip}`, 100, 60000), // 100 per minute
}

export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  if (address.length < 32 || address.length > 44) return false
  // Base58 character set
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)
}
