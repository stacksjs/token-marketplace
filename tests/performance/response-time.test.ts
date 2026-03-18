/**
 * Performance Tests
 *
 * Verifies that critical operations complete within acceptable time bounds.
 * Uses mock mode to test code path performance without network latency.
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

describe('Mock operation performance', () => {
  test('listNFT completes under 100ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(() => service.listNFT('mint1', BigInt(1_000_000_000)))
    expect(ms).toBeLessThan(100)
  })

  test('makeOffer completes under 100ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(() => service.makeOffer('mint2', BigInt(500_000_000)))
    expect(ms).toBeLessThan(100)
  })

  test('createAuction completes under 100ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(() =>
      service.createAuction('mint3', {
        type: 'english',
        startPrice: BigInt(1_000_000_000),
        duration: 3600,
      }),
    )
    expect(ms).toBeLessThan(100)
  })

  test('createCandyMachine completes under 200ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(() =>
      service.createCandyMachine({
        itemsAvailable: 1000,
        symbol: 'PERF',
        collectionMint: 'perfMint',
        creatorAddress: 'perfCreator',
      }),
    )
    expect(ms).toBeLessThan(200)
  })
})

describe('Batch operation performance', () => {
  test('adding 100 config lines under 500ms', async () => {
    const service = new TokenService()
    const configLines = Array.from({ length: 100 }, (_, i) => ({
      name: `NFT #${i}`,
      uri: `https://arweave.net/item${i}`,
    }))
    const ms = await measureTime(() => service.addConfigLines('perfCM', configLines))
    expect(ms).toBeLessThan(500)
  })

  test('10 sequential listings under 500ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(async () => {
      for (let i = 0; i < 10; i++) {
        await service.listNFT(`seqMint${i}`, BigInt((i + 1) * 1_000_000_000))
      }
    })
    expect(ms).toBeLessThan(500)
  })

  test('10 concurrent offers under 300ms', async () => {
    const service = new TokenService()
    const ms = await measureTime(() =>
      Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          service.makeOffer(`concMint${i}`, BigInt((i + 1) * 500_000_000)),
        ),
      ),
    )
    expect(ms).toBeLessThan(300)
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
