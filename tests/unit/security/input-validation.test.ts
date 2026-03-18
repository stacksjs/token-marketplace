/**
 * Input Validation Tests
 *
 * Tests Solana address validation, price validation, duration bounds,
 * and other input sanitization rules.
 */
import { describe, expect, test } from 'bun:test'

// ============================================
// Solana Address Validation
// ============================================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== 'string') return false
  if (address.length < 32 || address.length > 44) return false
  for (const char of address) {
    if (!BASE58_ALPHABET.includes(char)) return false
  }
  return true
}

describe('Solana address validation', () => {
  test('valid 44-character base58 address passes', () => {
    // 44 chars, all valid base58 (no 0, O, I, l)
    expect(isValidSolanaAddress('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstu')).toBe(true)
  })

  test('valid 32-character base58 address passes', () => {
    // 32 chars, all valid base58
    expect(isValidSolanaAddress('ABCDEFGHJKLMNPQRSTUVWXYZabcdefgh')).toBe(true)
  })

  test('too short address fails', () => {
    expect(isValidSolanaAddress('abc123')).toBe(false)
  })

  test('too long address fails', () => {
    expect(isValidSolanaAddress('A'.repeat(45))).toBe(false)
  })

  test('address with invalid characters (0, O, I, l) fails', () => {
    expect(isValidSolanaAddress('0OIl' + 'A'.repeat(40))).toBe(false)
  })

  test('address with spaces fails', () => {
    expect(isValidSolanaAddress('FakeMint 234567890123456789012345678901234')).toBe(false)
  })

  test('empty string fails', () => {
    expect(isValidSolanaAddress('')).toBe(false)
  })
})

// ============================================
// Price Validation
// ============================================

function isValidPrice(price: number): boolean {
  if (typeof price !== 'number') return false
  if (Number.isNaN(price)) return false
  if (price < 0) return false
  if (!Number.isFinite(price)) return false
  return true
}

function isValidListingPrice(price: number): boolean {
  return isValidPrice(price) && price > 0
}

describe('Price validation', () => {
  test('positive price passes', () => {
    expect(isValidPrice(1.5)).toBe(true)
  })

  test('zero price passes (valid for some operations)', () => {
    expect(isValidPrice(0)).toBe(true)
  })

  test('negative price fails', () => {
    expect(isValidPrice(-1)).toBe(false)
  })

  test('NaN fails', () => {
    expect(isValidPrice(NaN)).toBe(false)
  })

  test('Infinity fails', () => {
    expect(isValidPrice(Infinity)).toBe(false)
  })

  test('listing price must be > 0', () => {
    expect(isValidListingPrice(0)).toBe(false)
    expect(isValidListingPrice(0.001)).toBe(true)
  })

  test('very small listing price passes', () => {
    expect(isValidListingPrice(0.000001)).toBe(true)
  })

  test('very large listing price passes', () => {
    expect(isValidListingPrice(1_000_000)).toBe(true)
  })
})

// ============================================
// Auction Duration Validation
// ============================================

const MIN_AUCTION_DURATION = 3600        // 1 hour
const MAX_AUCTION_DURATION = 30 * 24 * 3600 // 30 days

function isValidAuctionDuration(seconds: number): boolean {
  if (typeof seconds !== 'number') return false
  if (!Number.isInteger(seconds)) return false
  return seconds >= MIN_AUCTION_DURATION && seconds <= MAX_AUCTION_DURATION
}

describe('Auction duration validation', () => {
  test('1 hour (minimum) passes', () => {
    expect(isValidAuctionDuration(3600)).toBe(true)
  })

  test('30 days (maximum) passes', () => {
    expect(isValidAuctionDuration(30 * 24 * 3600)).toBe(true)
  })

  test('24 hours passes', () => {
    expect(isValidAuctionDuration(86400)).toBe(true)
  })

  test('below minimum (59 minutes) fails', () => {
    expect(isValidAuctionDuration(3540)).toBe(false)
  })

  test('above maximum (31 days) fails', () => {
    expect(isValidAuctionDuration(31 * 24 * 3600)).toBe(false)
  })

  test('zero fails', () => {
    expect(isValidAuctionDuration(0)).toBe(false)
  })

  test('negative fails', () => {
    expect(isValidAuctionDuration(-3600)).toBe(false)
  })

  test('non-integer fails', () => {
    expect(isValidAuctionDuration(3600.5)).toBe(false)
  })
})

// ============================================
// Offer Expiry Validation
// ============================================

function isValidOfferExpiry(expiresAt: Date): boolean {
  if (!(expiresAt instanceof Date)) return false
  if (Number.isNaN(expiresAt.getTime())) return false
  return expiresAt.getTime() > Date.now()
}

describe('Offer expiry validation', () => {
  test('future date passes', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    expect(isValidOfferExpiry(future)).toBe(true)
  })

  test('past date fails', () => {
    const past = new Date(Date.now() - 1000)
    expect(isValidOfferExpiry(past)).toBe(false)
  })

  test('1 minute from now passes', () => {
    const soon = new Date(Date.now() + 60 * 1000)
    expect(isValidOfferExpiry(soon)).toBe(true)
  })

  test('invalid date fails', () => {
    expect(isValidOfferExpiry(new Date('invalid'))).toBe(false)
  })
})

// ============================================
// Bid Validation
// ============================================

function isValidBid(bidAmount: bigint, currentHighest: bigint, minIncrement: bigint): boolean {
  if (bidAmount <= BigInt(0)) return false
  if (bidAmount < currentHighest + minIncrement) return false
  return true
}

describe('Bid validation', () => {
  test('bid above current + increment passes', () => {
    expect(isValidBid(BigInt(2_000_000_000), BigInt(1_500_000_000), BigInt(100_000_000))).toBe(true)
  })

  test('bid exactly at current + increment passes', () => {
    expect(isValidBid(BigInt(1_600_000_000), BigInt(1_500_000_000), BigInt(100_000_000))).toBe(true)
  })

  test('bid below current + increment fails', () => {
    expect(isValidBid(BigInt(1_550_000_000), BigInt(1_500_000_000), BigInt(100_000_000))).toBe(false)
  })

  test('zero bid fails', () => {
    expect(isValidBid(BigInt(0), BigInt(0), BigInt(100_000_000))).toBe(false)
  })
})

// ============================================
// Basis Points Validation
// ============================================

function isValidBasisPoints(bps: number): boolean {
  if (typeof bps !== 'number') return false
  if (!Number.isInteger(bps)) return false
  return bps >= 0 && bps <= 10000
}

describe('Basis points validation', () => {
  test('0 bps passes', () => {
    expect(isValidBasisPoints(0)).toBe(true)
  })

  test('10000 bps (100%) passes', () => {
    expect(isValidBasisPoints(10000)).toBe(true)
  })

  test('500 bps (5%) passes', () => {
    expect(isValidBasisPoints(500)).toBe(true)
  })

  test('negative bps fails', () => {
    expect(isValidBasisPoints(-1)).toBe(false)
  })

  test('over 10000 bps fails', () => {
    expect(isValidBasisPoints(10001)).toBe(false)
  })

  test('non-integer bps fails', () => {
    expect(isValidBasisPoints(100.5)).toBe(false)
  })
})
