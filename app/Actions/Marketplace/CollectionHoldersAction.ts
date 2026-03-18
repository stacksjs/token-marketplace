import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Holders',
  description: 'Fetch holder distribution and top holders for a collection',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

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

    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    const totalSupply = nfts.length

    // Count NFTs per owner
    const ownerCounts: Record<string, number> = {}
    for (const nft of nfts) {
      const owner = (nft as any).owner_wallet_address
      if (!owner) continue
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1
    }

    const totalOwners = Object.keys(ownerCounts).length

    // Sort by holdings descending
    const sorted = Object.entries(ownerCounts)
      .sort(([, a], [, b]) => b - a)

    // Top holders
    const topHolders = sorted.slice(0, 20).map(([wallet, count]) => ({
      wallet,
      count,
      percentage: totalSupply > 0 ? Number(((count / totalSupply) * 100).toFixed(1)) : 0,
    }))

    // Concentration metrics
    const top1pctCount = Math.max(1, Math.ceil(totalOwners * 0.01))
    const top10pctCount = Math.max(1, Math.ceil(totalOwners * 0.10))
    const top1pctHoldings = sorted.slice(0, top1pctCount).reduce((sum, [, c]) => sum + c, 0)
    const top10pctHoldings = sorted.slice(0, top10pctCount).reduce((sum, [, c]) => sum + c, 0)

    // Distribution buckets
    const distribution = [
      { label: '1 NFT', count: sorted.filter(([, c]) => c === 1).length },
      { label: '2-5 NFTs', count: sorted.filter(([, c]) => c >= 2 && c <= 5).length },
      { label: '6-10 NFTs', count: sorted.filter(([, c]) => c >= 6 && c <= 10).length },
      { label: '11-25 NFTs', count: sorted.filter(([, c]) => c >= 11 && c <= 25).length },
      { label: '26+ NFTs', count: sorted.filter(([, c]) => c >= 26).length },
    ]

    return response.json({
      collectionSlug: slug,
      totalSupply,
      totalOwners,
      topHolders,
      distribution,
      concentration: {
        top1pct: totalSupply > 0 ? Number(((top1pctHoldings / totalSupply) * 100).toFixed(1)) : 0,
        top10pct: totalSupply > 0 ? Number(((top10pctHoldings / totalSupply) * 100).toFixed(1)) : 0,
      },
    })
  },
})
