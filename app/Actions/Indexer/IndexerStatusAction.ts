import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { txListenerService } from '../../Services/TransactionListenerService'
import { cache } from '../../Services/CacheService'

export default new Action({
  name: 'Indexer Status',
  description: 'Get the current status of the NFT indexer, including watched mints, sync stats, and cache health',
  method: 'GET',

  async handle(_request: RequestInstance) {
    const listenerStats = txListenerService.getStats()
    const cacheStats = cache.stats()

    // Count indexed NFTs
    let indexedCount = 0
    let traitCount = 0
    let eventCount = 0

    try {
      const nftResult = await db
        .selectFrom('nfts')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()
      indexedCount = Number(nftResult?.count || 0)
    }
    catch {
      // Table may not exist yet
    }

    try {
      const traitResult = await db
        .selectFrom('nft_traits')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()
      traitCount = Number(traitResult?.count || 0)
    }
    catch {
      // Table may not exist yet
    }

    try {
      const eventResult = await db
        .selectFrom('marketplace_events')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()
      eventCount = Number(eventResult?.count || 0)
    }
    catch {
      // Table may not exist yet
    }

    return response.json({
      status: 'running',
      indexer: {
        indexedNfts: indexedCount,
        indexedTraits: traitCount,
        marketplaceEvents: eventCount,
      },
      listener: listenerStats,
      cache: cacheStats,
    })
  },
})
