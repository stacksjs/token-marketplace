import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Stats',
  description: 'Fetch real-time stats for a collection: floor price, listed count, volume, owners, best offer',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()
      collection = allCollections.find((c: any) => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Fetch all NFTs for this collection
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    const totalSupply = nfts.length

    // Listed NFTs (have listing_price or is_for_sale)
    const listedNfts = nfts.filter((n: any) => n.is_for_sale === 1 || n.is_for_sale === true || n.listing_price)
    const listedCount = listedNfts.length

    // Floor price (lowest listed price in SOL)
    let floorPrice: number | null = null
    if (listedNfts.length > 0) {
      const prices = listedNfts
        .map((n: any) => n.listing_price ? Number(n.listing_price) / 1e9 : Number(n.price || 0))
        .filter((p: number) => p > 0)
      if (prices.length > 0) {
        floorPrice = Math.min(...prices)
      }
    }

    // Unique owners
    const owners = new Set(nfts.map((n: any) => n.owner_wallet_address).filter(Boolean))
    const ownersCount = owners.size

    // Best offer (highest active offer across all NFTs in collection)
    let bestOffer: number | null = null
    try {
      const nftIds = nfts.map((n: any) => n.id).filter(Boolean)
      if (nftIds.length > 0) {
        const offers = await db
          .selectFrom('offers')
          .selectAll()
          .where('nft_id', 'in', nftIds)
          .where('status', '=', 'pending')
          .execute()

        if (offers.length > 0) {
          bestOffer = Math.max(...offers.map((o: any) => Number(o.amount || 0) / 1e9))
        }
      }
    }
    catch {
      // offers table may not exist yet
    }

    // Total volume from collection stats columns (if available)
    const totalVolume = collection.total_volume ? Number(collection.total_volume) / 1e9 : 0

    return response.json({
      collectionSlug: slug,
      totalSupply,
      listedCount,
      floorPrice,
      ownersCount,
      bestOffer,
      totalVolume,
      listedRatio: totalSupply > 0 ? (listedCount / totalSupply * 100).toFixed(1) : '0.0',
    })
  },
})
