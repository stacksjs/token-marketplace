import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Analytics',
  description: 'Fetch analytics charts data for a collection: floor history, volume, sales',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')
    const period = request.getParam('period') || '7d'

    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    if (!collection) {
      const allCollections = await db.selectFrom('collections').selectAll().execute()
      collection = allCollections.find((c: any) => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Determine time range
    const now = new Date()
    const periodMs: Record<string, number> = {
      '24h': 24 * 3600000,
      '7d': 7 * 24 * 3600000,
      '30d': 30 * 24 * 3600000,
      'all': 365 * 24 * 3600000,
    }
    const rangeMs = periodMs[period] || periodMs['7d']
    const since = new Date(now.getTime() - rangeMs).toISOString()

    // Fetch stats snapshots if available
    let floorHistory: any[] = []
    let volumeHistory: any[] = []
    let salesHistory: any[] = []

    try {
      const snapshots = await db
        .selectFrom('collection_stats_snapshots' as any)
        .selectAll()
        .where('collection_id', '=', collection.id)
        .where('snapshot_at', '>=', since)
        .execute()

      floorHistory = snapshots.map((s: any) => ({
        timestamp: s.snapshot_at,
        value: s.floor_price ? Number(s.floor_price) / 1e9 : 0,
      }))

      volumeHistory = snapshots.map((s: any) => ({
        timestamp: s.snapshot_at,
        value: s.total_volume ? Number(s.total_volume) / 1e9 : 0,
      }))

      salesHistory = snapshots.map((s: any) => ({
        timestamp: s.snapshot_at,
        value: s.sales_count || 0,
      }))
    }
    catch {
      // Snapshots table may not exist; generate from transaction data
      try {
        const nftIds = (await db
          .selectFrom('nfts')
          .select(['id'])
          .where('collection_id', '=', collection.id)
          .execute()).map((n: any) => n.id)

        if (nftIds.length > 0) {
          const txns = await db
            .selectFrom('transactions')
            .selectAll()
            .where('nft_id', 'in', nftIds)
            .execute()

          const recentTxns = txns.filter((t: any) => t.created_at >= since)

          // Group by day
          const byDay: Record<string, { volume: number, sales: number }> = {}
          for (const tx of recentTxns) {
            const day = (tx as any).created_at?.slice(0, 10) || 'unknown'
            if (!byDay[day]) byDay[day] = { volume: 0, sales: 0 }
            byDay[day].volume += Number((tx as any).amount || 0) / 1e9
            byDay[day].sales++
          }

          volumeHistory = Object.entries(byDay).map(([day, data]) => ({ timestamp: day, value: data.volume }))
          salesHistory = Object.entries(byDay).map(([day, data]) => ({ timestamp: day, value: data.sales }))
        }
      }
      catch {
        // No transaction data available
      }
    }

    return response.json({
      collectionSlug: slug,
      period,
      floorHistory,
      volumeHistory,
      salesHistory,
    })
  },
})
