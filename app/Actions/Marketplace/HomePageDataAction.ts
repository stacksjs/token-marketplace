import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

// Helper to transform snake_case to camelCase
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export default new Action({
  name: 'Home Page Data',
  description: 'Fetch all data needed for the home page (collections, NFTs, stats)',
  method: 'GET',

  async handle() {
    // Fetch featured collections (minting or featured)
    const featuredCollectionsRaw = await db
      .selectFrom('collections')
      .selectAll()
      .where('is_minting', '=', 1)
      .orWhere('is_featured', '=', 1)
      .limit(3)
      .execute()

    // Fetch popular/live collections
    const popularCollectionsRaw = await db
      .selectFrom('collections')
      .selectAll()
      .where('is_live', '=', 1)
      .limit(3)
      .execute()

    // Fetch available NFTs (for sale or minting) with collection name
    const availableNftsRaw = await db
      .selectFrom('nfts')
      .leftJoin('collections', 'collections.id', 'nfts.collection_id')
      .select([
        'nfts.id', 'nfts.collection_id', 'nfts.name', 'nfts.token_id',
        'nfts.description', 'nfts.image_url', 'nfts.price',
        'nfts.is_for_sale', 'nfts.is_minting', 'nfts.mint_url',
        'nfts.rarity', 'nfts.rarity_rank',
        'collections.name as collection_name',
      ])
      .where('nfts.is_for_sale', '=', 1)
      .orWhere('nfts.is_minting', '=', 1)
      .limit(6)
      .execute()

    // Transform to camelCase for frontend
    const featuredCollections = featuredCollectionsRaw.map(toCamelCase)
    const popularCollections = popularCollectionsRaw.map(toCamelCase)
    const availableNfts = availableNftsRaw.map(toCamelCase)

    // Calculate stats using count() method
    const totalCollections = await db
      .selectFrom('collections')
      .count()

    const totalNfts = await db
      .selectFrom('nfts')
      .count()

    const stats = {
      totalCollections: Number(totalCollections || 0),
      totalNfts: Number(totalNfts || 0),
      totalVolume: '0 ETH',
    }

    return response.json({
      featuredCollections,
      popularCollections,
      availableNfts,
      stats,
    })
  },
})
