/**
 * In-memory cache service with TTL support.
 * In production, swap with Redis-backed cache.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class CacheService {
  private store: Map<string, CacheEntry<any>> = new Map()

  // TTL presets (in milliseconds)
  static readonly TTL = {
    NFT_METADATA: 3600000, // 1 hour (immutable after mint)
    COLLECTION_STATS: 30000, // 30 seconds
    LISTINGS: 10000, // 10 seconds
    FLOOR_PRICE: 15000, // 15 seconds
    SEARCH: 60000, // 1 minute
    ATTRIBUTES: 300000, // 5 minutes
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key)
    }
  }

  clear(): void {
    this.store.clear()
  }

  // Deduplicate concurrent requests for the same key
  private pending: Map<string, Promise<any>> = new Map()

  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    // Check if there's already a pending request for this key (deduplication)
    const pendingReq = this.pending.get(key)
    if (pendingReq) return pendingReq

    // Fetch and cache
    const promise = fetcher().then(data => {
      this.set(key, data, ttlMs)
      this.pending.delete(key)
      return data
    }).catch(err => {
      this.pending.delete(key)
      throw err
    })

    this.pending.set(key, promise)
    return promise
  }

  // Stats for monitoring
  stats(): { size: number, expired: number } {
    const now = Date.now()
    let expired = 0
    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expired++
    }
    return { size: this.store.size, expired }
  }
}

// Singleton instance
export const cache = new CacheService()
export default CacheService
