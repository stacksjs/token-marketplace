/**
 * Sync Ownership Job
 *
 * Periodically syncs on-chain NFT ownership for all active collections.
 * Catches transfers that happened outside our marketplace (e.g., direct
 * wallet transfers, sales on other marketplaces).
 *
 * Schedule: run every 30 seconds for active collections.
 * Fallback mechanism — if TransactionListenerService WebSocket misses events,
 * this job will catch up on the next poll cycle.
 *
 * Usage:
 *   import { runSyncOwnershipJob } from './app/Jobs/SyncOwnershipJob'
 *   await runSyncOwnershipJob(db)
 *
 *   // Or schedule via cron with a 30-second interval
 */

import { indexerService } from '../Services/IndexerService'
import { txListenerService } from '../Services/TransactionListenerService'

export async function runSyncOwnershipJob(db: any): Promise<{
  collectionsProcessed: number
  changesDetected: number
  errors: string[]
}> {
  const errors: string[] = []
  let collectionsProcessed = 0
  let changesDetected = 0

  let collections: any[]
  try {
    collections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()
  }
  catch (err) {
    return {
      collectionsProcessed: 0,
      changesDetected: 0,
      errors: [`Failed to fetch collections: ${err}`],
    }
  }

  for (const collection of collections) {
    try {
      const changes = await indexerService.syncSingleCollectionOwnership(
        db,
        collection.id,
      )

      collectionsProcessed++
      changesDetected += changes.length

      if (changes.length > 0) {
        console.log(
          `[SyncOwnership] ${collection.name || collection.slug}: `
          + `${changes.length} ownership change(s) detected`,
        )
      }
    }
    catch (err) {
      const msg = `Failed to sync ${collection.name || collection.id}: ${err}`
      console.error(`[SyncOwnership] ${msg}`)
      errors.push(msg)
    }
  }

  console.log(
    `[SyncOwnership] Processed ${collectionsProcessed} collection(s), `
    + `${changesDetected} change(s) detected`,
  )

  return { collectionsProcessed, changesDetected, errors }
}

/**
 * Start the ownership sync on a recurring interval.
 * Returns a cleanup function to stop the interval.
 */
export function startSyncOwnershipSchedule(
  db: any,
  intervalMs: number = 30_000,
): () => void {
  const timer = setInterval(async () => {
    try {
      await runSyncOwnershipJob(db)
    }
    catch (err) {
      console.error('[SyncOwnership] Scheduled job error:', err)
    }
  }, intervalMs)

  console.log(`[SyncOwnership] Scheduled every ${intervalMs / 1000}s`)

  return () => {
    clearInterval(timer)
    console.log('[SyncOwnership] Stopped')
  }
}
