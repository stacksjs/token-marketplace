/**
 * Fee & Royalty Calculation Tests
 *
 * Tests platform fees, royalties, creator splits, and edge cases.
 * Uses the same formula as PlatformFeeService.calculateFee.
 */
import { describe, expect, test } from 'bun:test'

// ============================================
// Pure fee calculation logic
// ============================================

function calculatePlatformFee(salePriceLamports: bigint, basisPoints: number): bigint {
  return (salePriceLamports * BigInt(basisPoints)) / BigInt(10000)
}

function calculateRoyalty(salePriceLamports: bigint, royaltyBasisPoints: number): bigint {
  return (salePriceLamports * BigInt(royaltyBasisPoints)) / BigInt(10000)
}

function calculateSellerReceives(
  salePriceLamports: bigint,
  platformFeeBps: number,
  royaltyBps: number,
): bigint {
  const platformFee = calculatePlatformFee(salePriceLamports, platformFeeBps)
  const royalty = calculateRoyalty(salePriceLamports, royaltyBps)
  return salePriceLamports - platformFee - royalty
}

// ============================================
// Platform Fee Tests
// ============================================

describe('Platform fee calculations', () => {
  test('1% fee on 1 SOL = 0.01 SOL (10,000,000 lamports)', () => {
    const oneSol = BigInt(1_000_000_000)
    expect(calculatePlatformFee(oneSol, 100)).toBe(BigInt(10_000_000))
  })

  test('1% fee on 10 SOL = 0.1 SOL', () => {
    const tenSol = BigInt(10_000_000_000)
    expect(calculatePlatformFee(tenSol, 100)).toBe(BigInt(100_000_000))
  })

  test('1% fee on 0.5 SOL', () => {
    const halfSol = BigInt(500_000_000)
    expect(calculatePlatformFee(halfSol, 100)).toBe(BigInt(5_000_000))
  })

  test('2% fee (200 bps) on 5 SOL', () => {
    const fiveSol = BigInt(5_000_000_000)
    expect(calculatePlatformFee(fiveSol, 200)).toBe(BigInt(100_000_000))
  })

  test('0 bps fee = zero fee', () => {
    expect(calculatePlatformFee(BigInt(10_000_000_000), 0)).toBe(BigInt(0))
  })

  test('0 price = zero fee', () => {
    expect(calculatePlatformFee(BigInt(0), 100)).toBe(BigInt(0))
  })

  test('very small amount (100 lamports) at 1%', () => {
    expect(calculatePlatformFee(BigInt(100), 100)).toBe(BigInt(1))
  })

  test('below threshold (99 lamports at 1%) rounds down to 0', () => {
    expect(calculatePlatformFee(BigInt(99), 100)).toBe(BigInt(0))
  })
})

// ============================================
// Royalty Tests
// ============================================

describe('Royalty calculations', () => {
  test('5% royalty (500 bps) on 2 SOL = 0.1 SOL', () => {
    const twoSol = BigInt(2_000_000_000)
    expect(calculateRoyalty(twoSol, 500)).toBe(BigInt(100_000_000))
  })

  test('10% royalty (1000 bps) on 1 SOL = 0.1 SOL', () => {
    const oneSol = BigInt(1_000_000_000)
    expect(calculateRoyalty(oneSol, 1000)).toBe(BigInt(100_000_000))
  })

  test('0% royalty = zero', () => {
    expect(calculateRoyalty(BigInt(5_000_000_000), 0)).toBe(BigInt(0))
  })
})

// ============================================
// Seller Receives Tests
// ============================================

describe('Seller receives calculation', () => {
  test('seller receives price minus royalty minus platform fee', () => {
    const price = BigInt(5_000_000_000) // 5 SOL
    const sellerReceives = calculateSellerReceives(price, 100, 500)
    const platformFee = calculatePlatformFee(price, 100)   // 0.05 SOL
    const royalty = calculateRoyalty(price, 500)             // 0.25 SOL
    expect(sellerReceives).toBe(price - platformFee - royalty)
    expect(sellerReceives).toBe(BigInt(4_700_000_000)) // 4.70 SOL
  })

  test('seller receives full price when no fees', () => {
    const price = BigInt(3_000_000_000)
    expect(calculateSellerReceives(price, 0, 0)).toBe(price)
  })

  test('all amounts sum to original price', () => {
    const price = BigInt(7_500_000_000)
    const platformFee = calculatePlatformFee(price, 100)
    const royalty = calculateRoyalty(price, 500)
    const sellerReceives = calculateSellerReceives(price, 100, 500)
    expect(platformFee + royalty + sellerReceives).toBe(price)
  })
})

// ============================================
// Creator Split Tests
// ============================================

describe('Creator split calculations', () => {
  test('2 creators at 60/40 split', () => {
    const royalty = BigInt(250_000_000) // 0.25 SOL
    const creator1Share = (royalty * BigInt(60)) / BigInt(100)
    const creator2Share = (royalty * BigInt(40)) / BigInt(100)
    expect(creator1Share).toBe(BigInt(150_000_000))
    expect(creator2Share).toBe(BigInt(100_000_000))
    expect(creator1Share + creator2Share).toBe(royalty)
  })

  test('3 creators at 50/30/20 split', () => {
    const royalty = BigInt(1_000_000_000) // 1 SOL
    const c1 = (royalty * BigInt(50)) / BigInt(100)
    const c2 = (royalty * BigInt(30)) / BigInt(100)
    const c3 = (royalty * BigInt(20)) / BigInt(100)
    expect(c1 + c2 + c3).toBe(royalty)
  })

  test('single creator gets 100%', () => {
    const royalty = BigInt(500_000_000)
    const creatorShare = (royalty * BigInt(100)) / BigInt(100)
    expect(creatorShare).toBe(royalty)
  })
})

// ============================================
// Edge Cases
// ============================================

describe('Fee edge cases', () => {
  test('maximum basis points (10000 = 100%) takes entire amount', () => {
    const price = BigInt(1_000_000_000)
    expect(calculatePlatformFee(price, 10000)).toBe(price)
  })

  test('large price (1000 SOL) calculates correctly', () => {
    const thousandSol = BigInt(1_000_000_000_000)
    const fee = calculatePlatformFee(thousandSol, 100) // 1%
    expect(fee).toBe(BigInt(10_000_000_000)) // 10 SOL
  })

  test('1 lamport at 1% fee = 0 (rounds down)', () => {
    expect(calculatePlatformFee(BigInt(1), 100)).toBe(BigInt(0))
  })
})
