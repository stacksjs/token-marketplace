/**
 * Rate Limiting Tests
 *
 * Tests the rate limiting logic for marketplace endpoints.
 */
import { describe, expect, test } from 'bun:test'

// ============================================
// Rate limiter implementation (same logic as production)
// ============================================

interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
}

function createRateLimiter(config: RateLimiterConfig) {
  const requests = new Map<string, number[]>()

  return {
    check(identifier: string): boolean {
      const now = Date.now()
      const windowStart = now - config.windowMs

      // Get existing timestamps for this identifier
      const timestamps = requests.get(identifier) ?? []

      // Filter to only timestamps within the window
      const recentTimestamps = timestamps.filter(t => t > windowStart)

      if (recentTimestamps.length >= config.maxRequests) {
        return false // rate limited
      }

      // Record this request
      recentTimestamps.push(now)
      requests.set(identifier, recentTimestamps)
      return true // allowed
    },

    reset(identifier: string): void {
      requests.delete(identifier)
    },

    resetAll(): void {
      requests.clear()
    },
  }
}

// ============================================
// Tests
// ============================================

describe('Rate limiter', () => {
  test('allows requests under limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
    const wallet = 'FakeWallet12345678901234567890123456789012'
    expect(limiter.check(wallet)).toBe(true)
    expect(limiter.check(wallet)).toBe(true)
    expect(limiter.check(wallet)).toBe(true)
  })

  test('blocks requests over limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
    const wallet = 'FakeWallet12345678901234567890123456789012'
    limiter.check(wallet) // 1
    limiter.check(wallet) // 2
    limiter.check(wallet) // 3
    expect(limiter.check(wallet)).toBe(false) // blocked
  })

  test('different identifiers have independent limits', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    expect(limiter.check('Wallet1_234567890123456789012345678901234')).toBe(true)
    expect(limiter.check('Wallet2_234567890123456789012345678901234')).toBe(true)
    expect(limiter.check('Wallet1_234567890123456789012345678901234')).toBe(false)
    expect(limiter.check('Wallet2_234567890123456789012345678901234')).toBe(false)
  })

  test('reset clears a specific identifier', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    limiter.check('WalletA_234567890123456789012345678901234')
    expect(limiter.check('WalletA_234567890123456789012345678901234')).toBe(false) // blocked
    limiter.reset('WalletA_234567890123456789012345678901234')
    expect(limiter.check('WalletA_234567890123456789012345678901234')).toBe(true) // allowed again
  })

  test('resetAll clears all identifiers', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    limiter.check('W1_345678901234567890123456789012345678901')
    limiter.check('W2_345678901234567890123456789012345678901')
    limiter.resetAll()
    expect(limiter.check('W1_345678901234567890123456789012345678901')).toBe(true)
    expect(limiter.check('W2_345678901234567890123456789012345678901')).toBe(true)
  })

  test('single request limit works', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
    const wallet = 'FakeWallet12345678901234567890123456789012'
    expect(limiter.check(wallet)).toBe(true)
    expect(limiter.check(wallet)).toBe(false)
  })

  test('high limit allows many requests', () => {
    const limiter = createRateLimiter({ maxRequests: 100, windowMs: 60_000 })
    const wallet = 'FakeWallet12345678901234567890123456789012'
    for (let i = 0; i < 100; i++) {
      expect(limiter.check(wallet)).toBe(true)
    }
    expect(limiter.check(wallet)).toBe(false)
  })
})

// ============================================
// Marketplace-specific rate limit configs
// ============================================

describe('Marketplace rate limit configs', () => {
  test('minting: 3 per wallet per minute', () => {
    const mintLimiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
    const wallet = 'MintWallet1234567890123456789012345678901'
    expect(mintLimiter.check(wallet)).toBe(true)
    expect(mintLimiter.check(wallet)).toBe(true)
    expect(mintLimiter.check(wallet)).toBe(true)
    expect(mintLimiter.check(wallet)).toBe(false)
  })

  test('offers: 10 per wallet per minute', () => {
    const offerLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
    const wallet = 'OfferWallet123456789012345678901234567890'
    for (let i = 0; i < 10; i++) {
      expect(offerLimiter.check(wallet)).toBe(true)
    }
    expect(offerLimiter.check(wallet)).toBe(false)
  })

  test('listings: 20 per wallet per minute', () => {
    const listingLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 })
    const wallet = 'ListWallet1234567890123456789012345678901'
    for (let i = 0; i < 20; i++) {
      expect(listingLimiter.check(wallet)).toBe(true)
    }
    expect(listingLimiter.check(wallet)).toBe(false)
  })
})
