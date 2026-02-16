import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import { generateSlug, toCamelCase } from '../helpers'

// Transform collection with slug fallback and real NFT count
function toCollectionData(collection: Record<string, any>, nftCountMap: Record<string, number>): Record<string, any> {
  const data = toCamelCase(collection)
  data.slug = data.slug || generateSlug(data.name)
  data.totalAmountOfNfts = nftCountMap[String(collection.id)] || 0
  return data
}

export default new Action({
  name: 'Home Page Data',
  description: 'Fetch all data needed for the home page (collections, NFTs, stats)',
  method: 'GET',

  async handle() {
    // Fetch collections with a reasonable limit (home page only needs a few)
    const allCollections = await db
      .selectFrom('collections')
      .selectAll()
      .limit(200)
      .execute()

    // Use COUNT queries for stats instead of loading all NFTs
    const totalNftsResult = await db
      .selectFrom('nfts')
      .select([db.fn.count('id').as('count')])
      .executeTakeFirst()
    const totalNfts = Number(totalNftsResult?.count || 0)

    const forSaleCountResult = await db
      .selectFrom('nfts')
      .select([db.fn.count('id').as('count')])
      .where('is_for_sale', '=', 1)
      .executeTakeFirst()
    const totalForSale = Number(forSaleCountResult?.count || 0)

    // Get NFT counts per collection in one query
    const nftCounts = await db
      .selectFrom('nfts')
      .select(['collection_id', db.fn.count('id').as('count')])
      .groupBy('collection_id')
      .execute()

    const nftCountMap: Record<string, number> = {}
    for (const row of nftCounts) {
      if (row.collection_id != null) {
        const key = String(Math.round(Number(row.collection_id)))
        nftCountMap[key] = Number(row.count)
      }
    }

    // Build collection lookup
    const collectionMap: Record<string, any> = {}
    for (const c of allCollections) {
      collectionMap[String(c.id)] = c
    }

    // Featured: collections that are actively minting or marked as featured
    const featuredCollections = allCollections
      .filter((c: any) => c.is_minting === 1 || c.is_featured === 1)
      .slice(0, 3)
      .map((c: any) => toCollectionData(c, nftCountMap))

    // Popular: live collections sorted by NFT count
    const popularCollections = allCollections
      .filter((c: any) => c.is_live === 1)
      .sort((a: any, b: any) => {
        const countA = nftCountMap[String(a.id)] || 0
        const countB = nftCountMap[String(b.id)] || 0
        return countB - countA
      })
      .slice(0, 3)
      .map((c: any) => toCollectionData(c, nftCountMap))

    // Minting collection IDs (for NFT filtering)
    const mintingCollectionIds = new Set(
      allCollections
        .filter((c: any) => c.is_minting === 1)
        .map((c: any) => String(Math.round(Number(c.id)))),
    )

    // Available NFTs: prioritize for-sale, then from minting collections (limited query)
    const forSaleNfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('is_for_sale', '=', 1)
      .limit(6)
      .execute()

    let availableNftsRaw = forSaleNfts
    if (forSaleNfts.length < 6 && mintingCollectionIds.size > 0) {
      const mintingIds = Array.from(mintingCollectionIds).map(Number)
      const mintingNfts = await db
        .selectFrom('nfts')
        .selectAll()
        .where('is_for_sale', '!=', 1)
        .where('collection_id', 'in', mintingIds)
        .limit(6 - forSaleNfts.length)
        .execute()
      availableNftsRaw = [...forSaleNfts, ...mintingNfts]
    }

    // Enrich NFTs with collection info
    const availableNfts = availableNftsRaw.map((nft: any) => {
      const colKey = String(Math.round(Number(nft.collection_id)))
      const col = collectionMap[colKey]
      const data = toCamelCase(nft)
      data.collectionName = col?.name || null
      data.collectionSlug = col?.slug || (col?.name ? generateSlug(col.name) : null)
      return data
    })

    const stats = {
      totalCollections: allCollections.length,
      totalNfts,
      totalForSale,
      totalMinting: mintingCollectionIds.size,
    }

    return response.json({
      featuredCollections,
      popularCollections,
      availableNfts,
      stats,
    })
  },
})
