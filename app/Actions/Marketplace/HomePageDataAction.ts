import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Helper to transform snake_case to camelCase
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

// Transform collection with slug fallback
function toCollectionData(collection: Record<string, any>): Record<string, any> {
  const data = toCamelCase(collection)
  data.slug = data.slug || generateSlug(data.name)
  return data
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

    // Fetch available NFTs (for sale or minting)
    const availableNftsRaw = await db
      .selectFrom('nfts')
      .selectAll()
      .where('is_for_sale', '=', 1)
      .orWhere('is_minting', '=', 1)
      .limit(6)
      .execute()

    // Look up collection names separately (query builder JOIN + select is broken for SQLite)
    const collectionIds = [...new Set(availableNftsRaw.map((n: any) => n.collection_id).filter(Boolean))]
    const collectionMap: Record<number, string> = {}
    if (collectionIds.length > 0) {
      const cols = await db
        .selectFrom('collections')
        .selectAll()
        .where('id', 'in', collectionIds)
        .execute()
      for (const c of cols) {
        collectionMap[(c as any).id] = (c as any).name
      }
    }

    // Merge collection_name into each NFT
    const availableNftsWithCollection = availableNftsRaw.map((nft: any) => ({
      ...nft,
      collection_name: collectionMap[nft.collection_id] || null,
    }))

    // Transform to camelCase for frontend (with slug fallback)
    const featuredCollections = featuredCollectionsRaw.map(toCollectionData)
    const popularCollections = popularCollectionsRaw.map(toCollectionData)
    const availableNfts = availableNftsWithCollection.map(toCamelCase)

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

    console.log('[HomePageData] featuredCollections:', featuredCollections.length, 'popularCollections:', popularCollections.length, 'availableNfts:', availableNfts.length, 'stats:', stats)

    return response.json({
      featuredCollections,
      popularCollections,
      availableNfts,
      stats,
    })
  },
})
