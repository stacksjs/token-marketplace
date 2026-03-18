/**
 * Performance Tests
 *
 * Verifies that critical operations complete within acceptable time bounds.
 * Tests instantiation and pure-computation operations that don't
 * require full service configuration.
 */
import { describe, expect, test } from 'bun:test'

process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService } from '../../app/Services/TokenService'

function measureTime(fn: () => void | Promise<void>): Promise<number> {
  const start = performance.now()
  const result = fn()
  if (result instanceof Promise) {
    return result.then(() => performance.now() - start)
  }
  return Promise.resolve(performance.now() - start)
}

describe('Service instantiation performance', () => {
  test('TokenService creation under 50ms', async () => {
    const ms = await measureTime(() => {
      new TokenService()
    })
    expect(ms).toBeLessThan(50)
  })

  test('TokenService creation with config under 50ms', async () => {
    const ms = await measureTime(() => {
      new TokenService({ network: 'devnet' })
    })
    expect(ms).toBeLessThan(50)
  })
})

describe('Merkle tree performance', () => {
  test('generate merkle root for 1000 addresses under 100ms', async () => {
    const service = new TokenService()
    const addresses = Array.from({ length: 1000 }, (_, i) => `wallet${i}`)
    const ms = await measureTime(() => {
      service.generateMerkleRoot(addresses)
    })
    expect(ms).toBeLessThan(100)
  })

  test('generate + verify merkle proof under 50ms', async () => {
    const service = new TokenService()
    const addresses = Array.from({ length: 500 }, (_, i) => `wallet${i}`)
    const root = service.generateMerkleRoot(addresses)
    const ms = await measureTime(() => {
      const { proof, leaf } = service.generateMerkleProof('wallet250', addresses)
      service.verifyMerkleProof(proof, leaf, root)
    })
    expect(ms).toBeLessThan(50)
  })
})

describe('Pure computation performance', () => {
  test('fee calculation for 10000 iterations under 50ms', async () => {
    const ms = await measureTime(() => {
      for (let i = 0; i < 10000; i++) {
        const salePrice = BigInt(i * 1_000_000)
        const feeBps = 250
        const fee = (salePrice * BigInt(feeBps)) / BigInt(10000)
        const seller = salePrice - fee
        if (seller < BigInt(0)) throw new Error('negative')
      }
    })
    expect(ms).toBeLessThan(50)
  })

  test('address validation for 10000 addresses under 50ms', async () => {
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const ms = await measureTime(() => {
      for (let i = 0; i < 10000; i++) {
        const addr = Array.from({ length: 44 }, () => BASE58[Math.floor(Math.random() * BASE58.length)]).join('')
        const valid = addr.length >= 32 && addr.length <= 44
        if (!valid) throw new Error('invalid')
      }
    })
    expect(ms).toBeLessThan(50)
  })
})
