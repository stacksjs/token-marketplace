import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug, paginate } from '../helpers'

export default new Action({
  name: 'Rarity Show',
  description: 'Fetch rarity data for a specific collection',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    // First try to find by slug column
    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    // If not found, try to find by generated slug from name
    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()

      collection = allCollections.find(c => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Fetch NFTs for this collection
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    // Calculate rarity distribution
    const rarityCount: Record<string, number> = {}
    for (const nft of nfts) {
      const rarity = (nft as any).rarity || 'Common'
      rarityCount[rarity] = (rarityCount[rarity] || 0) + 1
    }

    const totalNfts = nfts.length
    const rarityDistribution: Record<string, { count: number; percentage: number }> = {}
    for (const [rarity, count] of Object.entries(rarityCount)) {
      rarityDistribution[rarity.toLowerCase()] = {
        count,
        percentage: totalNfts > 0 ? Math.round((count / totalNfts) * 100) : 0,
      }
    }

    // Rank all NFTs by rarity
    const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
    const sortParam = request.getParam('sort') || 'rank_asc'
    const page = Math.max(1, Number(request.getParam('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 20))

    // First sort by rarity to assign ranks
    const rankedByRarity = [...nfts]
      .sort((a, b) => rarityOrder.indexOf((a as any).rarity || 'Common') - rarityOrder.indexOf((b as any).rarity || 'Common'))
      .map((nft: any, index) => ({
        id: nft.id,
        name: nft.name,
        rank: index + 1,
        rarity: nft.rarity,
        imageUrl: nft.image_url,
      }))

    // Apply user-requested sort
    let sorted = rankedByRarity
    switch (sortParam) {
      case 'rank_desc':
        sorted = rankedByRarity.slice().reverse()
        break
      case 'name':
        sorted = rankedByRarity.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'rank_asc':
      default:
        break
    }

    const paginated = paginate(sorted, page, limit)

    return response.json({
      collection: {
        ...collection,
        totalSupply: totalNfts,
        rarityDistribution,
      },
      rankedNfts: {
        data: paginated.data,
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
        totalPages: paginated.totalPages,
      },
    })
  },
})
