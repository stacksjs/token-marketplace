/**
 * Snapshot Collection Stats Job
 *
 * Takes periodic snapshots of collection statistics for historical analytics.
 * Should be run hourly. Stores floor price, listed count, volume, sales,
 * unique holders, and average price at each snapshot point.
 *
 * Data is stored in collection_stats_snapshots table and used for:
 *   - Price history charts
 *   - Volume trends
 *   - Holder distribution over time
 */

import { db } from '@stacksjs/database'

export interface SnapshotResult {
  collectionsProcessed: number
  snapshotsCreated: number
  errors: number
  processedAt: number
}

/**
 * Run the collection stats snapshot job.
 */
export async function runSnapshotCollectionStatsJob(): Promise<SnapshotResult> {
  const now = new Date().toISOString()
  let collectionsProcessed = 0
  let snapshotsCreated = 0
  let errors = 0

  try {
    // Get all collections
    const collections = await db
      .selectFrom('collections')
      .select(['id', 'floor_price', 'total_volume', 'total_sales', 'listed_count'])
      .execute()

    for (const collection of collections) {
      try {
        // Count unique holders
        let uniqueHolders = 0
        try {
          const holderResult = await db
            .selectFrom('nfts')
            .select(db.fn.count('id').as('count'))
            .where('collection_id', '=', collection.id)
            .where('owner_wallet', 'is not', null)
            .executeTakeFirst()
          uniqueHolders = Number(holderResult?.count || 0)
        }
        catch {
          // owner_wallet column may not exist
        }

        // Calculate average price from recent sales
        let avgPrice = 0
        try {
          const avgResult = await db
            .selectFrom('marketplace_events')
            .select(db.fn.avg('price').as('avg_price'))
            .where('collection_id', '=', String(collection.id))
            .where('type', '=', 'sale')
            .executeTakeFirst()
          avgPrice = Number(avgResult?.avg_price || 0)
        }
        catch {
          // marketplace_events may not exist
        }

        // Insert snapshot
        await db
          .insertInto('collection_stats_snapshots')
          .values({
            collection_id: collection.id,
            floor_price: Number(collection.floor_price || 0),
            listed_count: Number(collection.listed_count || 0),
            total_volume: Number(collection.total_volume || 0),
            total_sales: Number(collection.total_sales || 0),
            unique_holders: uniqueHolders,
            avg_price: Math.round(avgPrice),
            snapshot_at: now,
          })
          .execute()

        snapshotsCreated++
        collectionsProcessed++
      }
      catch {
        errors++
      }
    }
  }
  catch {
    // Tables may not exist yet
    errors++
  }

  return { collectionsProcessed, snapshotsCreated, errors, processedAt: Date.now() }
}

/**
 * Get historical stats for a collection.
 */
export async function getCollectionHistory(
  collectionId: number | string,
  period: '24h' | '7d' | '30d' | 'all' = '7d',
): Promise<any[]> {
  const since = periodToDate(period)

  try {
    let query = db
      .selectFrom('collection_stats_snapshots')
      .selectAll()
      .where('collection_id', '=', Number(collectionId))
      .orderBy('snapshot_at', 'asc')

    if (since) {
      query = query.where('snapshot_at', '>=', since.toISOString()) as any
    }

    return await query.execute()
  }
  catch {
    return []
  }
}

/**
 * Convert a period string to a Date.
 */
function periodToDate(period: string): Date | null {
  const now = Date.now()
  switch (period) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case 'all':
      return null
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
  }
}

/**
 * Start periodic stats snapshots.
 * Returns a cleanup function to stop the schedule.
 */
export function startSnapshotSchedule(intervalMs: number = 3600_000): () => void {
  const timer = setInterval(() => {
    runSnapshotCollectionStatsJob().catch(() => {})
  }, intervalMs)

  return () => clearInterval(timer)
}
