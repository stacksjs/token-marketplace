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
    // Fetch all collections and NFTs once
    const allCollections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    const allNfts = await db
      .selectFrom('nfts')
      .selectAll()
      .execute()

    // Build NFT count per collection
    const nftCountMap: Record<string, number> = {}
    for (const nft of allNfts) {
      if (nft.collection_id != null) {
        const key = String(Math.round(Number(nft.collection_id)))
        nftCountMap[key] = (nftCountMap[key] || 0) + 1
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

    // Available NFTs: prioritize for-sale, then from minting collections
    const forSaleNfts = allNfts.filter((n: any) => n.is_for_sale === 1)
    const mintingNfts = allNfts.filter((n: any) => {
      if (n.is_for_sale === 1) return false // already in forSaleNfts
      const colKey = String(Math.round(Number(n.collection_id)))
      return mintingCollectionIds.has(colKey)
    })

    const availableNftsRaw = [...forSaleNfts, ...mintingNfts].slice(0, 6)

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
      totalNfts: allNfts.length,
      totalForSale: forSaleNfts.length,
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
