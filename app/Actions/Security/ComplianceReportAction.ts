import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Compliance Report',
  description: 'Generate royalty compliance report for a collection',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')
    const period = request.getParam('period') || '30d'

    if (!slug) {
      return response.json({ error: 'Collection slug required' }, 422)
    }

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

    // Calculate period range
    const periodMs: Record<string, number> = {
      '7d': 7 * 24 * 3600000,
      '30d': 30 * 24 * 3600000,
      '90d': 90 * 24 * 3600000,
    }
    const since = new Date(Date.now() - (periodMs[period] || periodMs['30d'])).toISOString()

    let totalSales = 0
    let totalVolume = 0
    let royaltiesPaid = 0
    let royaltiesExpected = 0

    try {
      const nftIds = (await db.selectFrom('nfts').select(['id']).where('collection_id', '=', collection.id).execute()).map((n: any) => n.id)

      if (nftIds.length > 0) {
        const transactions = await db
          .selectFrom('transactions')
          .selectAll()
          .where('nft_id', 'in', nftIds)
          .execute()

        const recentSales = transactions.filter((t: any) =>
          (t.type === 'sale' || t.type === 'buy') && t.created_at >= since,
        )

        totalSales = recentSales.length
        totalVolume = recentSales.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) / 1e9

        // Expected royalties at 5%
        royaltiesExpected = totalVolume * 0.05

        // Actual royalties paid (from fee records)
        royaltiesPaid = recentSales.reduce((sum: number, t: any) => sum + Number((t as any).royalty_amount || 0), 0) / 1e9
      }
    }
    catch {
      // transactions table may not exist
    }

    const complianceRate = royaltiesExpected > 0
      ? Number(((royaltiesPaid / royaltiesExpected) * 100).toFixed(1))
      : 100

    return response.json({
      collectionSlug: slug,
      period,
      totalSales,
      totalVolume: Number(totalVolume.toFixed(4)),
      royaltiesPaid: Number(royaltiesPaid.toFixed(4)),
      royaltiesExpected: Number(royaltiesExpected.toFixed(4)),
      royaltiesEvaded: Number(Math.max(0, royaltiesExpected - royaltiesPaid).toFixed(4)),
      complianceRate,
    })
  },
})
