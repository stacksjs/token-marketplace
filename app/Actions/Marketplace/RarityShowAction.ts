import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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

    // Get top ranked NFTs (sorted by rarity)
    const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
    const topRanked = nfts
      .sort((a, b) => rarityOrder.indexOf((a as any).rarity || 'Common') - rarityOrder.indexOf((b as any).rarity || 'Common'))
      .slice(0, 10)
      .map((nft: any, index) => ({
        id: nft.id,
        name: nft.name,
        rank: index + 1,
        rarity: nft.rarity,
        imageUrl: nft.image_url,
      }))

    return response.json({
      collection: {
        ...collection,
        totalSupply: totalNfts,
        rarityDistribution,
        topRanked,
      },
    })
  },
})
