import { describe, expect, test, beforeEach } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify TransactionListenerService structure
// ============================================

const servicePath = 'app/Services/TransactionListenerService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TransactionListenerService structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('imports IndexerService', () => {
    expect(serviceSource).toContain("from './IndexerService'")
  })

  test('imports RPCService', () => {
    expect(serviceSource).toContain("from './RPCService'")
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const txListenerService = new TransactionListenerService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default TransactionListenerService')
  })

  test('does not depend on any external indexing API', () => {
    expect(serviceSource).not.toContain('helius')
    expect(serviceSource).not.toContain('shyft')
  })
})

describe('TransactionListenerService methods', () => {
  test('has onOwnershipChange callback registration', () => {
    expect(serviceSource).toContain('onOwnershipChange(')
  })

  test('has watchCollection method', () => {
    expect(serviceSource).toContain('async watchCollection(')
  })

  test('has watchMint method', () => {
    expect(serviceSource).toContain('watchMint(')
  })

  test('has unwatchMint method', () => {
    expect(serviceSource).toContain('unwatchMint(')
  })

  test('has pollOwnershipChanges method', () => {
    expect(serviceSource).toContain('async pollOwnershipChanges(')
  })

  test('has getStats method', () => {
    expect(serviceSource).toContain('getStats(')
  })

  test('has getWatchedMints method', () => {
    expect(serviceSource).toContain('getWatchedMints(')
  })

  test('has reset method', () => {
    expect(serviceSource).toContain('reset(')
  })
})

describe('TransactionListenerService types', () => {
  test('defines WatchedMint interface', () => {
    expect(serviceSource).toContain('interface WatchedMint')
    expect(serviceSource).toContain('mintAddress: string')
    expect(serviceSource).toContain('collectionId: number')
    expect(serviceSource).toContain('subscriptionId: number | null')
  })

  test('defines OwnershipChangeCallback type', () => {
    expect(serviceSource).toContain('type OwnershipChangeCallback')
  })
})

describe('TransactionListenerService implementation', () => {
  test('converts RPC URL to WebSocket URL', () => {
    expect(serviceSource).toContain("replace('https://', 'wss://')")
    expect(serviceSource).toContain("replace('http://', 'ws://')")
  })

  test('auto-delists transferred NFTs', () => {
    // When ownership changes, NFT should be delisted
    expect(serviceSource).toContain("status: 'unlisted'")
    expect(serviceSource).toContain('listing_price: null')
    expect(serviceSource).toContain('is_for_sale: 0')
  })

  test('records transfer events via indexerService', () => {
    expect(serviceSource).toContain('indexerService.recordEvent')
  })

  test('invokes callbacks on ownership change', () => {
    expect(serviceSource).toContain('for (const callback of this.onChangeCallbacks)')
  })

  test('handles callback errors gracefully', () => {
    const callbackSection = serviceSource.slice(
      serviceSource.indexOf('for (const callback of this.onChangeCallbacks'),
    )
    expect(callbackSection).toContain('catch')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('TransactionListenerService runtime', () => {
  beforeEach(async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')
    txListenerService.reset()
  })

  test('watchMint adds mint to watched list', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    txListenerService.watchMint('MINT_ABC', 1)

    expect(txListenerService.getWatchedMints()).toContain('MINT_ABC')
    expect(txListenerService.getStats().watchedMints).toBe(1)
  })

  test('watchMint does not duplicate entries', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    txListenerService.watchMint('MINT_ABC', 1)
    txListenerService.watchMint('MINT_ABC', 1)

    expect(txListenerService.getStats().watchedMints).toBe(1)
  })

  test('unwatchMint removes mint from watched list', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    txListenerService.watchMint('MINT_ABC', 1)
    txListenerService.watchMint('MINT_DEF', 2)
    expect(txListenerService.getStats().watchedMints).toBe(2)

    txListenerService.unwatchMint('MINT_ABC')
    expect(txListenerService.getStats().watchedMints).toBe(1)
    expect(txListenerService.getWatchedMints()).not.toContain('MINT_ABC')
    expect(txListenerService.getWatchedMints()).toContain('MINT_DEF')
  })

  test('unwatchMint handles non-existent mint gracefully', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    // Should not throw
    txListenerService.unwatchMint('NON_EXISTENT')
    expect(txListenerService.getStats().watchedMints).toBe(0)
  })

  test('watchCollection adds all collection NFTs to watch list', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    const mockDb = {
      selectFrom() {
        return {
          where() { return this },
          select() { return this },
          async execute() {
            return [
              { mint_address: 'M1' },
              { mint_address: 'M2' },
              { mint_address: 'M3' },
            ]
          },
        }
      },
    }

    const count = await txListenerService.watchCollection(mockDb, 1)
    expect(count).toBe(3)
    expect(txListenerService.getStats().watchedMints).toBe(3)
  })

  test('watchCollection returns 0 when DB query fails', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    const brokenDb = {
      selectFrom() {
        throw new Error('DB error')
      },
    }

    const count = await txListenerService.watchCollection(brokenDb, 1)
    expect(count).toBe(0)
  })

  test('onOwnershipChange registers callback', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    let callbackFired = false
    txListenerService.onOwnershipChange(() => {
      callbackFired = true
    })

    expect(txListenerService.getStats().callbackCount).toBe(1)
  })

  test('getStats returns correct shape', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    const stats = txListenerService.getStats()
    expect(stats).toHaveProperty('watchedMints')
    expect(stats).toHaveProperty('isConnected')
    expect(stats).toHaveProperty('callbackCount')
    expect(typeof stats.watchedMints).toBe('number')
    expect(typeof stats.isConnected).toBe('boolean')
    expect(typeof stats.callbackCount).toBe('number')
  })

  test('reset clears all state', async () => {
    const { txListenerService } = await import('../../../app/Services/TransactionListenerService')

    txListenerService.watchMint('M1', 1)
    txListenerService.watchMint('M2', 2)
    txListenerService.onOwnershipChange(() => {})

    txListenerService.reset()

    const stats = txListenerService.getStats()
    expect(stats.watchedMints).toBe(0)
    expect(stats.callbackCount).toBe(0)
    expect(stats.isConnected).toBe(false)
  })
})
